import type { AllErrorCodes, APITypes, ErrorResponse } from "$lib/api/types";
import LocalStorageHelper from "$lib/client/helpers/local-storage";
import type { UserRole } from "$lib/server/db/types";

const BASE_API_URL = '/api';

export type ApiError =
    "Network Error" |
    "Unauthorized" |
    "Forbidden" |
    "Not Found" |
    "Internal Server Error" |
    "Unknown Error";

export type ApiResponse<T> = {
    success: true;
    status: number;

    data: T;
} | {
    success: false;
    status: number;

    error?:{
        code: AllErrorCodes;
        message: string;
    }
    apiError?: ApiError;
}

export interface ApiParams<T>{
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: T;
    expectContent?: boolean;
    formData?: boolean;
}

const HttpCodeToApiErrorMap: Record<number, ApiError> = {
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error"
}

//TODO: Fix the following:
// This api request function has an issue.
// If the frontend decides to make multiple requests in parallel after the JWT has expired,
// each of those requests will attempt to refresh the token, causing multiple refresh requests to be sent.
// Implement some locking mechanism to ensure only one refresh request is sent at a time
// This is somewhat mitigated by the heartbeat mechanism though.

export const ApiRequest = async <ResponseT, RequestT = any>(params: ApiParams<RequestT>, attemptRefresh = true): Promise<ApiResponse<ResponseT>> => {
    return new Promise<ApiResponse<ResponseT>>(async (resolve, reject) => {
        try {
            const response = await fetch(`${BASE_API_URL}${params.path}`, {
                method: params.method || 'GET',
                headers: params.formData ? {} : {
                    'Content-Type': 'application/json'
                },
                body: !params.body ? undefined :
                    params.formData ? (params.body as any) : JSON.stringify(params.body)
            })

            async function resolveErrorResponse(resp: Response){
                const errorData = await response.json().catch(()=>null) as ErrorResponse | null;

                if(errorData && errorData.error) {
                    resolve({
                        success: false,
                        error: {
                            message: errorData.error.message,
                            code: errorData.error.code as AllErrorCodes,
                        },
                        status: response.status
                    })
                }

                return resolveWithErrorStatus(response.status);
            }

            function resolveWithErrorStatus(status: number){
                resolve({
                    success: false,
                    apiError: HttpCodeToApiErrorMap[status] || "Unknown Error",
                    status: status
                });
            }

            if (response.ok) {
                if(params.expectContent !== undefined && params.expectContent === false) {
                    resolve({
                        success: true,
                        data: null as ResponseT,
                        status: response.status
                    });
                }else{
                    const data = await response.json();
                    resolve({
                        success: true,
                        data: data as ResponseT,
                        status: response.status
                    });
                }
            } else {
                if(attemptRefresh && response.status === 401){
                    // Try to refresh the token

                    const refreshResponse = await ApiRequest<APITypes.Auth.Refresh.Response>({
                        method: 'POST',
                        path: '/auth/refresh',
                    }, false)

                    if(refreshResponse.success){
                        LocalStorageHelper.SetJwtExpirationTimestamp(refreshResponse.data.jwtExpiresAtTimestamp);
                        // Retry original request
                        const retryResponse = await ApiRequest<ResponseT, RequestT>(params, false);
                        resolve(retryResponse);
                        return;
                    }else{
                        // Could not refresh, return original 401 response
                        return resolveErrorResponse(response);
                    }
                }

                return resolveErrorResponse(response);
            }
        } catch (error) {
            reject({
                success: false,
                apiError: "Network Error",
                status: 0
            });
        }
    })
}

interface API{
    auth:{
        login: (
            username: string,
            password: string
        ) => Promise<ApiResponse<APITypes.Auth.Login.Response>>,
        register: (
            username: string,
            password: string,
            otc: string
        ) => Promise<ApiResponse<APITypes.Auth.Register.Response>>,
        logout: () => Promise<ApiResponse<void>>
        logoutEverywhere: () => Promise<ApiResponse<void>>
        refresh: () => Promise<ApiResponse<APITypes.Auth.Refresh.Response>>        
    },
    user:{
        get: () => Promise<ApiResponse<APITypes.User.GetData.Response>>,
        changePassword: (currentPassword: string, newPassword: string) => Promise<ApiResponse<void>>
        changeUsername: (newUsername: string, password: string) => Promise<ApiResponse<void>>
        getOTCs: () => Promise<ApiResponse<APITypes.User.GetOTCs.Response>>
    },
    posts:{
        create: (
            content: string,
            anonymous: boolean,
        ) => Promise<ApiResponse<APITypes.Posts.Create.Response>>,
        getById: (
            postId: string
        ) => Promise<ApiResponse<APITypes.Posts.Get.Response>>,
        delete: (
            postId: string,
            suspension?: {
                reason: string;
                duration: number | null;
            }
        ) => Promise<ApiResponse<APITypes.Posts.Delete.Response>>,
        query: (
            startTimeStamp: number,
            endTimeStamp: number,
        ) => Promise<ApiResponse<APITypes.Posts.Query.Response>>,
        setVote: (
            postId: string,
            voteType: "upvote" | "downvote" | "remove_vote"
        ) => Promise<ApiResponse<APITypes.Posts.Vote.Response>>
    },
    admin:{
        changeConfig: (newConfig: APITypes.Admin.ModifyConfig.Request) => Promise<ApiResponse<void>>
        getConfig: () => Promise<ApiResponse<APITypes.Admin.GetServerConfig.Response>>
        otcs:{
            issueToRoles: (
                roles: UserRole[],
                expiresInMs: number,
                countPerUser: number
            ) => Promise<ApiResponse<void>>
            deleteById: (
                otcId: string
            ) => Promise<ApiResponse<void>>
            issueToUser: (
                userId: string,
                expiresInMs: number,
                count: number
            ) => Promise<ApiResponse<void>>
            statistics: () => Promise<ApiResponse<APITypes.Admin.OTC.Statistics.Response>>
            deleteFromUser: (
                userId: string
            ) => Promise<ApiResponse<void>>
            deleteAll: () => Promise<ApiResponse<void>>
        }
        users:{
            getById: (userId: string) => Promise<ApiResponse<APITypes.Admin.Users.GetById.Response>>
            query: (roleFilter?: UserRole, usernameFilter?: string) => Promise<ApiResponse<APITypes.Admin.Users.Query.Response>>
            createModerator: (username: string, password: string) => Promise<ApiResponse<void>>
            deleteById: (userId: string) => Promise<ApiResponse<void>>
            changeUsername: (userId: string, newUsername: string) => Promise<ApiResponse<void>>
            changePassword: (userId: string, newPassword: string) => Promise<ApiResponse<void>>
            verifyPassword: (userId: string, password: string) => Promise<ApiResponse<APITypes.Admin.Users.VerifyPassword.Response>>
            setCanChangeUsername: (userId: string, canChangeUsername: boolean) => Promise<ApiResponse<void>>
            suspendUser: (userId: string, duration: number | null, reason?: string,) => Promise<ApiResponse<void>>
            liftSuspension: (userId: string, reason?: string) => Promise<ApiResponse<void>>
        },
        records:{
            expungeOld: () => Promise<ApiResponse<APITypes.Admin.Records.ExpungeResponse>>
            query: () => Promise<ApiResponse<APITypes.Admin.Records.QueryResponse>>
        },
        instagramPosts:{
            uploadImage: (imageData: FormData) => Promise<ApiResponse<APITypes.Admin.Instagram.UploadImage.Response>>
            createPost: (
                imageIds: string[],
                caption?: string,
            ) => Promise<ApiResponse<void>>
        }
    },
    serverConfig:{
        get: () => Promise<ApiResponse<APITypes.ServerConfig.Response>>
    },
    comments:{
        create: (
            postId: string,
            content: string,
            anonymous: boolean,
        ) => Promise<ApiResponse<void>>,
        getByPostId: (
            postId: string
        ) => Promise<ApiResponse<APITypes.Posts.Comment.Get.Response>>,
        delete: (
            postId: string,
            commentId: string,
            suspension?: {
                reason: string;
                duration: number | null;
            }
        ) => Promise<ApiResponse<APITypes.Posts.Comment.Delete.Response>>,
        getById:(
            commentId: string,
            postId: string
        ) => Promise<ApiResponse<APITypes.Posts.Comment.GetById.Response>>
    },
    moderation:{
        getAuthorLastSuspension: (
            type: "post" | "comment",
            id: string
        ) => Promise<ApiResponse<APITypes.Moderation.AuthorLastSuspension.Response>>;
        getLatestContent: (
            after: number
        ) => Promise<ApiResponse<APITypes.Moderation.LatestContent.Response>>;
    }
}

export const API: API = {
    auth: {
        login: (username, password) => 
            ApiRequest<APITypes.Auth.Login.Response, APITypes.Auth.Login.Request>({
                path: '/auth/login',
                method: 'POST',
                body: {
                    username,
                    password
                }
            }),
        register: (username, password, otc) => 
            ApiRequest<APITypes.Auth.Register.Response, APITypes.Auth.Register.Request>({
                path: '/auth/register',
                method: 'POST',
                body: {
                    username,
                    password,
                    registrationOTC: otc
                }
            }),
        logout: () => 
            ApiRequest<void>({
                path: '/auth/logout',
                method: 'POST',
                expectContent: false,
            }),
        logoutEverywhere: () =>
            ApiRequest<void>({ 
                path: '/auth/logout-everywhere',
                method: 'POST',
                expectContent: false,
            }),
        refresh: () =>
            ApiRequest<APITypes.Auth.Refresh.Response>({
                path: '/auth/refresh',
                method: 'POST',
            }, false)
    },
    user: {
        get: () => 
            ApiRequest<APITypes.User.GetData.Response>({
                path: '/user',
                method: 'GET'
            }),
        changePassword: (currentPassword, newPassword) =>
            ApiRequest<void, APITypes.User.ChangePassword.Request>({
                path: '/user/change-password',
                method: 'POST',
                body: {
                    currentPassword,
                    newPassword
                },
                expectContent: false,
            }),
        changeUsername: (newUsername, password) =>
            ApiRequest<void, APITypes.User.ChangeUsername.Request>({
                path: '/user/change-username',
                method: 'POST',
                body: {
                    newUsername,
                    password
                },
                expectContent: false,
            }),
        getOTCs: () =>
            ApiRequest<APITypes.User.GetOTCs.Response>({
                path: '/user/otcs',
                method: 'GET'
            })
    },
    posts: {
        create: (content, anonymous) =>
            ApiRequest<APITypes.Posts.Create.Response, APITypes.Posts.Create.Request>({
                path: "/posts",
                method: "POST",
                body: {
                    content: content,
                    anonymous: anonymous
                }
            }),
        getById: (postId) =>
            ApiRequest<APITypes.Posts.Get.Response>({
                method: "GET",
                path: `/posts/${postId}`
            }),
        delete: (postId, suspension) =>
            ApiRequest<APITypes.Posts.Delete.Response, APITypes.Posts.Delete.Request>({
                method: "DELETE",
                path: `/posts/${postId}`,
                body: suspension ? { suspension } : {},
            }),
        query: (startTimeStamp, endTimeStamp) =>
            ApiRequest<APITypes.Posts.Query.Response>({
                method: "GET",
                path: `/posts?start=${startTimeStamp}&end=${endTimeStamp}`
            }),
        setVote: (postId, voteType) =>
            ApiRequest<APITypes.Posts.Vote.Response, APITypes.Posts.Vote.Request>({
                method: "POST",
                path: `/posts/${postId}/vote`,
                body: {
                    postId,
                    voteType
                },
            })
    },
    admin:{
        changeConfig: (newConfig) =>
            ApiRequest<void, APITypes.Admin.ModifyConfig.Request>({
                method: "POST",
                path: `/admin/config`,
                body: newConfig,
                expectContent: false,
            }),
        getConfig: () => 
            ApiRequest<APITypes.Admin.GetServerConfig.Response>({
                method: "GET",
                path: `/admin/config`,
            }),
        otcs:{
            issueToRoles: (roles, expiresInMs, countPerUser) =>
                ApiRequest<void, APITypes.Admin.OTC.IssueToRoles.Request>({
                    method: "POST",
                    path: `/admin/otcs/issue-to-roles`,
                    body: {
                        roles,
                        durationMs: expiresInMs,
                        count: countPerUser
                    },
                    expectContent: false,
                }),
            deleteById: (otcId) =>
                ApiRequest<void, APITypes.Admin.OTC.DeleteById.Request>({
                    method: "DELETE",
                    path: `/admin/otcs/delete-by-id`,
                    body: {
                        otcId
                    },
                    expectContent: false,
                }),
            issueToUser: (userId, expiresInMs, count) =>
                ApiRequest<void, APITypes.Admin.OTC.IssueToUser.Request>({
                    method: "POST",
                    path: `/admin/otcs/issue-to-user`,
                    body: {
                        userId,
                        durationMs: expiresInMs,
                        count
                    },
                    expectContent: false,
                }),
            statistics: () =>
                ApiRequest<APITypes.Admin.OTC.Statistics.Response>({
                    method: "GET",
                    path: `/admin/otcs/statistics`
                }),
            deleteFromUser: (userId) =>
                ApiRequest<void, APITypes.Admin.OTC.DeleteAllUserOTCs.Request>({
                    method: "DELETE",
                    path: `/admin/otcs/delete-all-user-otcs`,
                    body: {
                        userId
                    },
                    expectContent: false,
                }),
            deleteAll: () =>
                ApiRequest<void>({
                    method: "DELETE",
                    path: `/admin/otcs/delete-all`,
                    expectContent: false,
                })
        },
        users:{
            getById: (userId) =>
                ApiRequest<APITypes.Admin.Users.GetById.Response>({
                    method: "GET",
                    path: `/admin/users/${userId}`
                }),
            query: (roleFilter, usernameFilter) => {
                let path = '/admin/users/query';
                const params: string[] = [];
                if (roleFilter) {
                    params.push(`role=${roleFilter}`);
                }
                if (usernameFilter) {
                    params.push(`username=${encodeURIComponent(usernameFilter)}`);
                }
                if (params.length > 0) {
                    path += `?${params.join('&')}`;
                }
                return ApiRequest<APITypes.Admin.Users.Query.Response>({
                    method: "GET",
                    path: path
                })
            },
            createModerator: (username, password) =>
                ApiRequest<void, APITypes.Admin.Users.CreateModerator.Request>({
                    method: "POST",
                    path: `/admin/users/create-moderator`,
                    body: {
                        username,
                        password
                    },
                    expectContent: false,
                }),
            deleteById: (userId) =>
                ApiRequest<void>({
                    method: "DELETE",
                    path: `/admin/users/${userId}`,
                    expectContent: false,
                }),
            changeUsername: (userId, newUsername) =>
                ApiRequest<void, APITypes.Admin.Users.ChangeUsername.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/change-username`,
                    body: {
                        newUsername
                    },
                    expectContent: false,
                }),
            changePassword: (userId, newPassword) =>
                ApiRequest<void, APITypes.Admin.Users.ChangePassword.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/change-password`,
                    body: {
                        newPassword
                    },
                    expectContent: false,
                }),
            verifyPassword: (userId, password) =>
                ApiRequest<APITypes.Admin.Users.VerifyPassword.Response, APITypes.Admin.Users.VerifyPassword.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/verify-password`,
                    body: {
                        password
                    },
                }),
            setCanChangeUsername: (userId, canChangeUsername) =>
                ApiRequest<void, APITypes.Admin.Users.SetCanChangeUsername.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/set-can-change-username`,
                    body: {
                        canChangeUsername
                    },
                    expectContent: false,
                }),
            suspendUser: (userId, duration, reason) =>
                ApiRequest<void, APITypes.Admin.Users.SuspendUser.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/suspend`,
                    body: {
                        reason,
                        duration
                    },
                    expectContent: false,
                }),
            liftSuspension: (userId, reason) =>
                ApiRequest<void, APITypes.Admin.Users.LiftSuspension.Request>({
                    method: "POST",
                    path: `/admin/users/${userId}/lift-suspension`,
                    body: {
                        reason
                    },
                    expectContent: false,
                })
        },
        records:{
            expungeOld: () =>
                ApiRequest<APITypes.Admin.Records.ExpungeResponse>({
                    method: "POST",
                    path: `/admin/records/expunge-old`
                }),
            query: () =>
                ApiRequest<APITypes.Admin.Records.QueryResponse>({
                    method: "GET",
                    path: `/admin/records/query`
                })
        },
        instagramPosts:{
            uploadImage: (imageData) =>
                ApiRequest<APITypes.Admin.Instagram.UploadImage.Response, FormData>({
                    method: "POST",
                    path: '/admin/instagram-posts/upload-image',
                    body: imageData,
                    formData: true,
                }),
            createPost: (containerIds, caption) =>
                ApiRequest<void, APITypes.Admin.Instagram.CreatePost.Request>({
                    path: '/admin/instagram-posts/create-post',
                    method: "POST",
                    body: {
                        containerIds: containerIds,
                        caption: caption
                    },
                    expectContent: false,
                })
        },
        
    },
    serverConfig:{
        get: () => 
            ApiRequest<APITypes.ServerConfig.Response>({
                method: "GET",
                path: `/server-config`
            })
    },
    comments: {
        create: (postId, content, anonymous) =>
            ApiRequest<void, APITypes.Posts.Comment.Create.Request>({
                method: "POST",
                path: `/posts/${postId}/comments`,
                body: {
                    content,
                    anonymous
                },
                expectContent: false,
            }),
        getByPostId: (postId) =>
            ApiRequest<APITypes.Posts.Comment.Get.Response>({
                method: "GET",
                path: `/posts/${postId}/comments`
            }),
        delete: (postId, commentId, suspension) =>
            ApiRequest<APITypes.Posts.Comment.Delete.Response, APITypes.Posts.Comment.Delete.Request>({
                method: "DELETE",
                path: `/posts/${postId}/comments/${commentId}`,
                body: suspension ? { suspension } : {},
            }),
        getById: (commentId, postId) =>
            ApiRequest<APITypes.Posts.Comment.GetById.Response>({
                method: "GET",
                path: `/posts/${postId}/comments/${commentId}`
            })
    },
    moderation: {
        getAuthorLastSuspension: (type, id) =>
            ApiRequest<APITypes.Moderation.AuthorLastSuspension.Response>({
                method: "GET",
                path: `/moderation/author-last-suspension?type=${type}&id=${id}`
            }),
        getLatestContent: (after) =>
            ApiRequest<APITypes.Moderation.LatestContent.Response>({
                method: "GET",
                path: `/moderation/latest-content?after=${after}`
            })
    }
}
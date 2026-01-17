*This is only a technical guide. If you want to find out more about this project's purpose, please refer to /static/about/about.md.*

# Project development information

### Versions
node => 24.11.0
ts-node => 10.9.2
MongoDB => 8.0.17
Docker => 29.1.4, build 0e6fee6

### Database

MongoDB is used for data storage. Since transactions are needed for this project, the database should be a replica set (one instance is enough). Currently, no in-memory database solution is present within the project for development purposes, making it difficult to test the website (requiring a local installation of MongoDB)

### Environment variables

**Only used in local development purposes, overridden in production by docker-compose.yml**
`MONGODB_URI=mongodb://user:password@host:27017/db-name?authSource=admin`

**Used in both production and development environments**
`JWT_SECRET=a-long-string`

`PASSWORD_HASHING_ROUNDS=12`

`DEV=true`

`DOMAIN=https://production-domain.com`

`INSTAGRAM_API_KEY=your-instagram-api-key` *Good luck getting this :), the process is lengthy and annoying*

`INSTAGRAM_USER_ID=your-instagram-user-id`

`PUBLIC_INSTAGRAM_HANDLE=your-instagram-handle`

**Environment variables that only used in production**

`PROD_OUTPUT_PORT=5000` *The port that will be exposed when compiling the project in production*

`MONGODB_REPLICA_SET_KEY=replicasetkey123`

`MONGODB_ROOT_PASSWORD=rootpassword123`

`MONGODB_DB_NAME=posts-dev`

### Running the code

For a development website instance, run `npm run dev`. To initialize the database, set the `MONGODB_URI` environment variable in the `.env` file and run `npx tsx scripts/init-db.ts` (requires typescript). Don't forget to configure the MongoDB database as a replica set (for transaction support).

### Testing

There currently is only one test file, which tests user interaction limits imposed by the administrator. To run it, execute the command `npm run test`.

### Production

To run a production instance of this project, docker is required. Run the command `docker compose up --build` to create the containers. The exposed website port is defined in the environment variables (see above).

# Project funcionality description

## Anonymity

### Endpoint information
For any user, the `/api/posts` (GET) endpoint returns a list of sanitized posts. These posts do not contain the user ID of the author, only the username ("Anonymous" if posted anonymously), and a boolean value, signifying if the content was made by the user calling the endpoint. This endpoint works even for non-authenticated users, for which the aforementioned boolean value will always be false.

### Moderator data access
Moderators can request for any piece of content's (post or comment) author last suspension. This reveals the last suspension timestamp, duration and reason. The suspension might not be active, even if by the returned values it is indicated that it is, because the administrator has the ability to lift any active suspension, but that does not delete the suspension history. For content which does not have an associated user ID, a message will appear that the content is without an associated author. This is only possible if the content was posted anonymously.

### Administrator data expunging
The administrator has the ability to delete (expunge) author user ID data from posts and comments, given that they are older than the set "max delete lifetime", which is a config value the administrator controls. 

## Deletion and suspension
A moderator or administrator has the ability to delete any piece of content (post or comment), given that it isn't older than the admin set "max delete lifetime". Along with content deletion, moderators and administrators have the ability to suspend the user by specifying a duration and (optionally) a reason. If the suspension given is shorter than the currently active one, a message will be displayed that the suspension was not applied, though the deletion still happens. If no user is "attached" to a piece of content, the deletion still happens, but a message is shown that a suspension could not be applied (since there is no associated user to apply it to).

## Moderator accountability
The administrator of the site has the ability to see the latest moderation actions (suspensions and content deletions) of moderators. If any malicious activity is detected, the administrator has the ability to suspend any moderator or delete their account.

## Outside content control

### Instagram
The administrator has the option to select posts and publish them to instagram as images in a carousel post. A carousel post only allows between 2 to 10 images, so a single image is impossible to post (in the context of this project). The website handles images inefficiently, though it ensures the exact same images in instagram as they appear in the administrator interface.

### Discord
The administrator has the ability to add any arbitraty number of discord webhooks, which will forward newly-created posts to discord channels. If a post is deleted, the website will attempt to also delete the content in discord, though this is not guaranteed.
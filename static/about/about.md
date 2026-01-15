# What is this website?

This website is a platform that allows users in a closed community to create text-based posts, vote on posts, and comment on them. That's it! Think of it as Reddit, but with only 10% of the functionality :).

Developer:
- Mindaugas Simukaitis / mindaugassimukaitis (at) gmail (dot) com
- And that's it ://

## What's the purpose?

This website wasn't created to be a groundbreaking product or a sophisticated, high-demand platform. It was simply a practice project for me, the developer (Mindaugas Simukaitis). Through this project, I learned a lot - from NoSQL databases and better coding practices to Cloudflare and much more. 

## Anonymity

The key feature of this website is the ability to post anonymously. However, moderators can still (sometimes) suspend users who made an anonymous post. How is that possible if the post was anonymous? Since [the code for this website is public](https://github.com/minsim1/posts-website), there's no point in hiding how anonymity is handled on this platform. Here's what personally identifiable information different entities can see (when content was created anonymously):

- **Other users** => Nothing. No user ID or username is revealed in the website or anywhere else.
- **Moderators** => Your last suspension time, duration, and reason. Moderators can check any post's or comment's author last suspension without any penalty or limitation. However, this still does not reveal your actual author user ID or username.
- **Administrator/system** => Essentially everything. Although the administrator's interface (frontend) doesn't directly reveal a post's or comment's author user ID, this can be circumvented. However, this doesn't mean the end of anonymity (see below).

## Protection of anonymity

The administrator determines how recent a post or comment must be for it to still be deletable. After a piece of content (post or comment) becomes older than that limit, it is marked for data expungement. The administrator can then press one button to permanently delete any user ID from posts or comments older than the set limit. After that, the connection between the content and its author is truly and irreversibly severed.

## Instagram and Discord integration

The administrator can configure Discord webhooks to re-post user created posts. If the post is deleted, the associated webhooks are also called to delete the content from Discord as well. The administrator can add as many Discord webhooks to the server configuration as needed. The administrator also has the ability to select posts and upload them to Instagram, though this process is not automatic.
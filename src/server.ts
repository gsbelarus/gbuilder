import Koa from 'koa';
import Router from '@koa/router';
import http from 'http';
import bodyParser from 'koa-bodyparser';
import { Octokit } from '@octokit/core';
import { existsSync, readFileSync } from 'fs';
import { IParams } from './types';
import { buildWorkbench } from './buildWorkbench';
import dateFormat from 'dateformat';
import { ug } from './ug';
import { mi } from './mi';

// {
//   "method": "POST",
//   "url": "/webhook/gedemin",
//   "header": {
//     "host": "gdmn.app:8087",
//     "user-agent": "GitHub-Hookshot/0cec5b5",
//     "content-length": "7142",
//     "accept": "*/*",
//     "x-github-delivery": "bcc9d3c0-8702-11eb-9cd6-852452cbdc0e",
//     "x-github-event": "ping",
//     "x-github-hook-id": "287112063",
//     "x-github-hook-installation-target-id": "44751861",
//     "x-github-hook-installation-target-type": "repository",
//     "content-type": "application/json",
//     "connection": "close"
//   }
// }

// {
//   "method": "POST",
//   "url": "/webhook/gedemin",
//   "header": {
//     "host": "gdmn.app:8087",
//     "user-agent": "GitHub-Hookshot/0cec5b5",
//     "content-length": "8928",
//     "accept": "*/*",
//     "x-github-delivery": "6bcc87e6-8703-11eb-81d0-a5cd22366bd3",
//     "x-github-event": "push",
//     "x-github-hook-id": "287112063",
//     "x-github-hook-installation-target-id": "44751861",
//     "x-github-hook-installation-target-type": "repository",
//     "content-type": "application/json",
//     "connection": "close"
//   }
// }

// {
//   "method": "POST",
//   "url": "/webhook/gedemin",
//   "header": {
//     "host": "gdmn.app:8087",
//     "user-agent": "GitHub-Hookshot/0cec5b5",
//     "content-length": "8928",
//     "accept": "*/*",
//     "x-github-delivery": "2caeb402-8704-11eb-9a5d-9bc1a3411aa7",
//     "x-github-event": "push",
//     "x-github-hook-id": "287112063",
//     "x-github-hook-installation-target-id": "44751861",
//     "x-github-hook-installation-target-type": "repository",
//     "content-type": "application/json",
//     "connection": "close"
//   }
// }
// {
//   "ref": "refs/heads/india",
//   "before": "10a0b5e43466537eb5545d0e3d01b7a71dfd644b",
//   "after": "ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//   "repository": {
//     "id": 44751861,
//     "node_id": "MDEwOlJlcG9zaXRvcnk0NDc1MTg2MQ==",
//     "name": "gedemin-private",
//     "full_name": "GoldenSoftwareLtd/gedemin-private",
//     "private": true,
//     "owner": {
//       "name": "GoldenSoftwareLtd",
//       "email": "gs1994@gmail.com",
//       "login": "GoldenSoftwareLtd",
//       "id": 11398387,
//       "node_id": "MDEyOk9yZ2FuaXphdGlvbjExMzk4Mzg3",
//       "avatar_url": "https://avatars.githubusercontent.com/u/11398387?v=4",
//       "gravatar_id": "",
//       "url": "https://api.github.com/users/GoldenSoftwareLtd",
//       "html_url": "https://github.com/GoldenSoftwareLtd",
//       "followers_url": "https://api.github.com/users/GoldenSoftwareLtd/followers",
//       "following_url": "https://api.github.com/users/GoldenSoftwareLtd/following{/other_user}",
//       "gists_url": "https://api.github.com/users/GoldenSoftwareLtd/gists{/gist_id}",
//       "starred_url": "https://api.github.com/users/GoldenSoftwareLtd/starred{/owner}{/repo}",
//       "subscriptions_url": "https://api.github.com/users/GoldenSoftwareLtd/subscriptions",
//       "organizations_url": "https://api.github.com/users/GoldenSoftwareLtd/orgs",
//       "repos_url": "https://api.github.com/users/GoldenSoftwareLtd/repos",
//       "events_url": "https://api.github.com/users/GoldenSoftwareLtd/events{/privacy}",
//       "received_events_url": "https://api.github.com/users/GoldenSoftwareLtd/received_events",
//       "type": "Organization",
//       "site_admin": false
//     },
//     "html_url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "description": null,
//     "fork": false,
//     "url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "forks_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/forks",
//     "keys_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/keys{/key_id}",
//     "collaborators_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/collaborators{/collaborator}",
//     "teams_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/teams",
//     "hooks_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/hooks",
//     "issue_events_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues/events{/number}",
//     "events_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/events",
//     "assignees_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/assignees{/user}",
//     "branches_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/branches{/branch}",
//     "tags_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/tags",
//     "blobs_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/blobs{/sha}",
//     "git_tags_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/tags{/sha}",
//     "git_refs_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/refs{/sha}",
//     "trees_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/trees{/sha}",
//     "statuses_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/statuses/{sha}",
//     "languages_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/languages",
//     "stargazers_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/stargazers",
//     "contributors_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/contributors",
//     "subscribers_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/subscribers",
//     "subscription_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/subscription",
//     "commits_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/commits{/sha}",
//     "git_commits_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/commits{/sha}",
//     "comments_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/comments{/number}",
//     "issue_comment_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues/comments{/number}",
//     "contents_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/contents/{+path}",
//     "compare_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/compare/{base}...{head}",
//     "merges_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/merges",
//     "archive_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/{archive_format}{/ref}",
//     "downloads_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/downloads",
//     "issues_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues{/number}",
//     "pulls_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/pulls{/number}",
//     "milestones_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/milestones{/number}",
//     "notifications_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/notifications{?since,all,participating}",
//     "labels_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/labels{/name}",
//     "releases_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/releases{/id}",
//     "deployments_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/deployments",
//     "created_at": 1445525039,
//     "updated_at": "2021-03-12T07:52:48Z",
//     "pushed_at": 1615973756,
//     "git_url": "git://github.com/GoldenSoftwareLtd/gedemin-private.git",
//     "ssh_url": "git@github.com:GoldenSoftwareLtd/gedemin-private.git",
//     "clone_url": "https://github.com/GoldenSoftwareLtd/gedemin-private.git",
//     "svn_url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "homepage": null,
//     "size": 122922,
//     "stargazers_count": 1,
//     "watchers_count": 1,
//     "language": "Pascal",
//     "has_issues": true,
//     "has_projects": true,
//     "has_downloads": true,
//     "has_wiki": true,
//     "has_pages": false,
//     "forks_count": 0,
//     "mirror_url": null,
//     "archived": false,
//     "disabled": false,
//     "open_issues_count": 7,
//     "license": null,
//     "forks": 0,
//     "open_issues": 7,
//     "watchers": 1,
//     "default_branch": "master",
//     "stargazers": 1,
//     "master_branch": "master",
//     "organization": "GoldenSoftwareLtd"
//   },
//   "pusher": {
//     "name": "gsbelarus",
//     "email": "gs1994@gmail.com"
//   },
//   "organization": {
//     "login": "GoldenSoftwareLtd",
//     "id": 11398387,
//     "node_id": "MDEyOk9yZ2FuaXphdGlvbjExMzk4Mzg3",
//     "url": "https://api.github.com/orgs/GoldenSoftwareLtd",
//     "repos_url": "https://api.github.com/orgs/GoldenSoftwareLtd/repos",
//     "events_url": "https://api.github.com/orgs/GoldenSoftwareLtd/events",
//     "hooks_url": "https://api.github.com/orgs/GoldenSoftwareLtd/hooks",
//     "issues_url": "https://api.github.com/orgs/GoldenSoftwareLtd/issues",
//     "members_url": "https://api.github.com/orgs/GoldenSoftwareLtd/members{/member}",
//     "public_members_url": "https://api.github.com/orgs/GoldenSoftwareLtd/public_members{/member}",
//     "avatar_url": "https://avatars.githubusercontent.com/u/11398387?v=4",
//     "description": "Software development. ERP systems based on the Gedemin platform."
//   },
//   "sender": {
//     "login": "gsbelarus",
//     "id": 5175764,
//     "node_id": "MDQ6VXNlcjUxNzU3NjQ=",
//     "avatar_url": "https://avatars.githubusercontent.com/u/5175764?v=4",
//     "gravatar_id": "",
//     "url": "https://api.github.com/users/gsbelarus",
//     "html_url": "https://github.com/gsbelarus",
//     "followers_url": "https://api.github.com/users/gsbelarus/followers",
//     "following_url": "https://api.github.com/users/gsbelarus/following{/other_user}",
//     "gists_url": "https://api.github.com/users/gsbelarus/gists{/gist_id}",
//     "starred_url": "https://api.github.com/users/gsbelarus/starred{/owner}{/repo}",
//     "subscriptions_url": "https://api.github.com/users/gsbelarus/subscriptions",
//     "organizations_url": "https://api.github.com/users/gsbelarus/orgs",
//     "repos_url": "https://api.github.com/users/gsbelarus/repos",
//     "events_url": "https://api.github.com/users/gsbelarus/events{/privacy}",
//     "received_events_url": "https://api.github.com/users/gsbelarus/received_events",
//     "type": "User",
//     "site_admin": false
//   },
//   "created": false,
//   "deleted": false,
//   "forced": false,
//   "base_ref": null,
//   "compare": "https://github.com/GoldenSoftwareLtd/gedemin-private/compare/10a0b5e43466...ee7b34fa1630",
//   "commits": [
//     {
//       "id": "ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//       "tree_id": "5cc92a23adfbb7f1b844cbc5b321900a7cc2a138",
//       "distinct": true,
//       "message": "Inc build number",
//       "timestamp": "2021-03-17T12:36:08+03:00",
//       "url": "https://github.com/GoldenSoftwareLtd/gedemin-private/commit/ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//       "author": {
//         "name": "andreik",
//         "email": "gs1994@gmail.com",
//         "username": "gsbelarus"
//       },
//       "committer": {
//         "name": "andreik",
//         "email": "gs1994@gmail.com",
//         "username": "gsbelarus"
//       },
//       "added": [],
//       "removed": [],
//       "modified": [
//         "Gedemin/GUDF/Gudf_ver.rc",
//         "Gedemin/Gedemin/gdcc_ver.rc",
//         "Gedemin/Gedemin/gedemin_upd_ver.rc",
//         "Gedemin/Gedemin/gedemin_ver.rc"
//       ]
//     }
//   ],
//   "head_commit": {
//     "id": "ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//     "tree_id": "5cc92a23adfbb7f1b844cbc5b321900a7cc2a138",
//     "distinct": true,
//     "message": "Inc build number",
//     "timestamp": "2021-03-17T12:36:08+03:00",
//     "url": "https://github.com/GoldenSoftwareLtd/gedemin-private/commit/ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//     "author": {
//       "name": "andreik",
//       "email": "gs1994@gmail.com",
//       "username": "gsbelarus"
//     },
//     "committer": {
//       "name": "andreik",
//       "email": "gs1994@gmail.com",
//       "username": "gsbelarus"
//     },
//     "added": [],
//     "removed": [],
//     "modified": [
//       "Gedemin/GUDF/Gudf_ver.rc",
//       "Gedemin/Gedemin/gdcc_ver.rc",
//       "Gedemin/Gedemin/gedemin_upd_ver.rc",
//       "Gedemin/Gedemin/gedemin_ver.rc"
//     ]
//   }
// }

// {
//   "method": "POST",
//   "url": "/webhook/gedemin",
//   "header": {
//     "host": "gdmn.app:8087",
//     "user-agent": "GitHub-Hookshot/0cec5b5",
//     "content-length": "8928",
//     "accept": "*/*",
//     "x-github-delivery": "d1663d94-8704-11eb-8119-0dd0e05f47ba",
//     "x-github-event": "push",
//     "x-github-hook-id": "287112063",
//     "x-github-hook-installation-target-id": "44751861",
//     "x-github-hook-installation-target-type": "repository",
//     "content-type": "application/json",
//     "connection": "close"
//   }
// }
// {
//   "ref": "refs/heads/india",
//   "before": "ee7b34fa1630ad58fd865285d8e0ebab55756f8b",
//   "after": "9aa6776e0016a20e6ef4747f4d01b7f6e656e911",
//   "repository": {
//     "id": 44751861,
//     "node_id": "MDEwOlJlcG9zaXRvcnk0NDc1MTg2MQ==",
//     "name": "gedemin-private",
//     "full_name": "GoldenSoftwareLtd/gedemin-private",
//     "private": true,
//     "owner": {
//       "name": "GoldenSoftwareLtd",
//       "email": "gs1994@gmail.com",
//       "login": "GoldenSoftwareLtd",
//       "id": 11398387,
//       "node_id": "MDEyOk9yZ2FuaXphdGlvbjExMzk4Mzg3",
//       "avatar_url": "https://avatars.githubusercontent.com/u/11398387?v=4",
//       "gravatar_id": "",
//       "url": "https://api.github.com/users/GoldenSoftwareLtd",
//       "html_url": "https://github.com/GoldenSoftwareLtd",
//       "followers_url": "https://api.github.com/users/GoldenSoftwareLtd/followers",
//       "following_url": "https://api.github.com/users/GoldenSoftwareLtd/following{/other_user}",
//       "gists_url": "https://api.github.com/users/GoldenSoftwareLtd/gists{/gist_id}",
//       "starred_url": "https://api.github.com/users/GoldenSoftwareLtd/starred{/owner}{/repo}",
//       "subscriptions_url": "https://api.github.com/users/GoldenSoftwareLtd/subscriptions",
//       "organizations_url": "https://api.github.com/users/GoldenSoftwareLtd/orgs",
//       "repos_url": "https://api.github.com/users/GoldenSoftwareLtd/repos",
//       "events_url": "https://api.github.com/users/GoldenSoftwareLtd/events{/privacy}",
//       "received_events_url": "https://api.github.com/users/GoldenSoftwareLtd/received_events",
//       "type": "Organization",
//       "site_admin": false
//     },
//     "html_url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "description": null,
//     "fork": false,
//     "url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "forks_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/forks",
//     "keys_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/keys{/key_id}",
//     "collaborators_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/collaborators{/collaborator}",
//     "teams_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/teams",
//     "hooks_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/hooks",
//     "issue_events_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues/events{/number}",
//     "events_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/events",
//     "assignees_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/assignees{/user}",
//     "branches_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/branches{/branch}",
//     "tags_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/tags",
//     "blobs_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/blobs{/sha}",
//     "git_tags_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/tags{/sha}",
//     "git_refs_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/refs{/sha}",
//     "trees_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/trees{/sha}",
//     "statuses_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/statuses/{sha}",
//     "languages_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/languages",
//     "stargazers_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/stargazers",
//     "contributors_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/contributors",
//     "subscribers_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/subscribers",
//     "subscription_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/subscription",
//     "commits_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/commits{/sha}",
//     "git_commits_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/git/commits{/sha}",
//     "comments_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/comments{/number}",
//     "issue_comment_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues/comments{/number}",
//     "contents_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/contents/{+path}",
//     "compare_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/compare/{base}...{head}",
//     "merges_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/merges",
//     "archive_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/{archive_format}{/ref}",
//     "downloads_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/downloads",
//     "issues_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/issues{/number}",
//     "pulls_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/pulls{/number}",
//     "milestones_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/milestones{/number}",
//     "notifications_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/notifications{?since,all,participating}",
//     "labels_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/labels{/name}",
//     "releases_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/releases{/id}",
//     "deployments_url": "https://api.github.com/repos/GoldenSoftwareLtd/gedemin-private/deployments",
//     "created_at": 1445525039,
//     "updated_at": "2021-03-12T07:52:48Z",
//     "pushed_at": 1615974032,
//     "git_url": "git://github.com/GoldenSoftwareLtd/gedemin-private.git",
//     "ssh_url": "git@github.com:GoldenSoftwareLtd/gedemin-private.git",
//     "clone_url": "https://github.com/GoldenSoftwareLtd/gedemin-private.git",
//     "svn_url": "https://github.com/GoldenSoftwareLtd/gedemin-private",
//     "homepage": null,
//     "size": 122922,
//     "stargazers_count": 1,
//     "watchers_count": 1,
//     "language": "Pascal",
//     "has_issues": true,
//     "has_projects": true,
//     "has_downloads": true,
//     "has_wiki": true,
//     "has_pages": false,
//     "forks_count": 0,
//     "mirror_url": null,
//     "archived": false,
//     "disabled": false,
//     "open_issues_count": 7,
//     "license": null,
//     "forks": 0,
//     "open_issues": 7,
//     "watchers": 1,
//     "default_branch": "master",
//     "stargazers": 1,
//     "master_branch": "master",
//     "organization": "GoldenSoftwareLtd"
//   },
//   "pusher": {
//     "name": "gsbelarus",
//     "email": "gs1994@gmail.com"
//   },
//   "organization": {
//     "login": "GoldenSoftwareLtd",
//     "id": 11398387,
//     "node_id": "MDEyOk9yZ2FuaXphdGlvbjExMzk4Mzg3",
//     "url": "https://api.github.com/orgs/GoldenSoftwareLtd",
//     "repos_url": "https://api.github.com/orgs/GoldenSoftwareLtd/repos",
//     "events_url": "https://api.github.com/orgs/GoldenSoftwareLtd/events",
//     "hooks_url": "https://api.github.com/orgs/GoldenSoftwareLtd/hooks",
//     "issues_url": "https://api.github.com/orgs/GoldenSoftwareLtd/issues",
//     "members_url": "https://api.github.com/orgs/GoldenSoftwareLtd/members{/member}",
//     "public_members_url": "https://api.github.com/orgs/GoldenSoftwareLtd/public_members{/member}",
//     "avatar_url": "https://avatars.githubusercontent.com/u/11398387?v=4",
//     "description": "Software development. ERP systems based on the Gedemin platform."
//   },
//   "sender": {
//     "login": "gsbelarus",
//     "id": 5175764,
//     "node_id": "MDQ6VXNlcjUxNzU3NjQ=",
//     "avatar_url": "https://avatars.githubusercontent.com/u/5175764?v=4",
//     "gravatar_id": "",
//     "url": "https://api.github.com/users/gsbelarus",
//     "html_url": "https://github.com/gsbelarus",
//     "followers_url": "https://api.github.com/users/gsbelarus/followers",
//     "following_url": "https://api.github.com/users/gsbelarus/following{/other_user}",
//     "gists_url": "https://api.github.com/users/gsbelarus/gists{/gist_id}",
//     "starred_url": "https://api.github.com/users/gsbelarus/starred{/owner}{/repo}",
//     "subscriptions_url": "https://api.github.com/users/gsbelarus/subscriptions",
//     "organizations_url": "https://api.github.com/users/gsbelarus/orgs",
//     "repos_url": "https://api.github.com/users/gsbelarus/repos",
//     "events_url": "https://api.github.com/users/gsbelarus/events{/privacy}",
//     "received_events_url": "https://api.github.com/users/gsbelarus/received_events",
//     "type": "User",
//     "site_admin": false
//   },
//   "created": false,
//   "deleted": false,
//   "forced": false,
//   "base_ref": null,
//   "compare": "https://github.com/GoldenSoftwareLtd/gedemin-private/compare/ee7b34fa1630...9aa6776e0016",
//   "commits": [
//     {
//       "id": "9aa6776e0016a20e6ef4747f4d01b7f6e656e911",
//       "tree_id": "9e9a80800bf5a29eabdb7fe3df3417c11b936669",
//       "distinct": true,
//       "message": "Inc build number",
//       "timestamp": "2021-03-17T12:40:44+03:00",
//       "url": "https://github.com/GoldenSoftwareLtd/gedemin-private/commit/9aa6776e0016a20e6ef4747f4d01b7f6e656e911",
//       "author": {
//         "name": "andreik",
//         "email": "gs1994@gmail.com",
//         "username": "gsbelarus"
//       },
//       "committer": {
//         "name": "andreik",
//         "email": "gs1994@gmail.com",
//         "username": "gsbelarus"
//       },
//       "added": [],
//       "removed": [],
//       "modified": [
//         "Gedemin/GUDF/Gudf_ver.rc",
//         "Gedemin/Gedemin/gdcc_ver.rc",
//         "Gedemin/Gedemin/gedemin_upd_ver.rc",
//         "Gedemin/Gedemin/gedemin_ver.rc"
//       ]
//     }
//   ],
//   "head_commit": {
//     "id": "9aa6776e0016a20e6ef4747f4d01b7f6e656e911",
//     "tree_id": "9e9a80800bf5a29eabdb7fe3df3417c11b936669",
//     "distinct": true,
//     "message": "Inc build number",
//     "timestamp": "2021-03-17T12:40:44+03:00",
//     "url": "https://github.com/GoldenSoftwareLtd/gedemin-private/commit/9aa6776e0016a20e6ef4747f4d01b7f6e656e911",
//     "author": {
//       "name": "andreik",
//       "email": "gs1994@gmail.com",
//       "username": "gsbelarus"
//     },
//     "committer": {
//       "name": "andreik",
//       "email": "gs1994@gmail.com",
//       "username": "gsbelarus"
//     },
//     "added": [],
//     "removed": [],
//     "modified": [
//       "Gedemin/GUDF/Gudf_ver.rc",
//       "Gedemin/Gedemin/gdcc_ver.rc",
//       "Gedemin/Gedemin/gedemin_upd_ver.rc",
//       "Gedemin/Gedemin/gedemin_ver.rc"
//     ]
//   }
// }

interface ILog {
  logged: Date;
  repo: string;
  state: string;
  commitMessage: string;
  url: string;
};

const log: ILog[] = [];

const paramsFile = process.argv[2];
let params: IParams;

if (!paramsFile || !existsSync(paramsFile)) {
  throw new Error('Full name of the file with build process parameters must be specified as a first command line argument.');
} else {
  try {
    params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
  } catch(e) {
    throw new Error(`Error parsing JSON file ${paramsFile}. ${e}`);
  }
}

const app = new Koa();
const router = new Router();
const octokit = new Octokit({ auth: params.pat });

router.get('/', ctx => {
  const l = log.map( 
    ({ logged, repo, state, commitMessage, url }) => 
      `${dateFormat(logged, 'dd.mm.yy HH:MM:ss')} -- ${repo} -- ${state} -- <a href="${url}">${commitMessage}</a>` 
  );
  ctx.response.body = `<html><body><pre>Webhook server is working...</pre><p/><pre>${l.join('\n')}</pre></body></html>`;
});

type Fn = () => Promise<void>;
const queue: Fn[] = [];
let exeReady = false;

router.post('/webhook/gedemin', async (ctx) => {
  const body = (ctx.request as any).body;

  if (!body.head_commit) {
    // это скорее всего ПИНГ событие
    ctx.response.status = 200;
    return;
  }

  const sha = body.head_commit.id;
  const commitMessage = body.head_commit.message;
  const url = body.head_commit.url;

  console.log(JSON.stringify(ctx.request, undefined, 2));

  const updateState = state => octokit
    .request('POST /repos/{owner}/{repo}/statuses/{sha}', {
      owner: 'GoldenSoftwareLtd',
      repo: 'gedemin-private',
      sha,
      state
    })
    .then( () => console.log(`state for gedemin-private set to ${state}...`) )
    .then( () => { log.push({ logged: new Date(), repo: 'gedemin-private', state, commitMessage, url }) } )

  if (commitMessage === 'Inc build number') {
    queue.push( () => updateState('success') );
  } else {
    queue.push( async () => {
      exeReady = false;
      await updateState('pending');
      try {
        if (
          await buildWorkbench(ug, { compilationType: 'DEBUG', commitIncBuildNumber: false })
          &&
          await buildWorkbench(ug, { compilationType: 'LOCK', commitIncBuildNumber: false })
          &&
          await buildWorkbench(ug, { compilationType: 'PRODUCT', commitIncBuildNumber: true })
        ) {
          await updateState('success');
          exeReady = true;
        } else {
          await updateState('error');
        }
      } catch(e) {
        await updateState('error');
        console.error(e.message);
      }
    });
  }

  while (queue.length) {
    await queue.shift()!();
  }

  ctx.response.status = 200;
});

router.post('/webhook/gedemin-apps', async (ctx) => {
  const body = (ctx.request as any).body;

  if (!body.head_commit) {
    // это скорее всего ПИНГ событие
    ctx.response.status = 200;
    return;
  }

  const sha = body.head_commit.id;
  const commitMessage = body.head_commit.message;
  const url = body.head_commit.url;

  console.log(JSON.stringify(ctx.request, undefined, 2));

  const updateState = state => octokit
    .request('POST /repos/{owner}/{repo}/statuses/{sha}', {
      owner: 'GoldenSoftwareLtd',
      repo: 'gedemin-apps',
      sha,
      state
    })
    .then( () => console.log(`state for gedemin-apps set to ${state}...`) )
    .then( () => { log.push({ logged: new Date(), repo: 'gedemin-apps', state, commitMessage, url }) } )

  // возможно, экзешник как раз сейчас компилируется  
  if (!exeReady) {
    while (queue.length) {
      await queue.shift()!();
    }  
  }  

  queue.push( async () => {
    await updateState('pending');
    try {
      if (
        (exeReady || await buildWorkbench(ug, { compilationType: 'PRODUCT', commitIncBuildNumber: false }))
        &&
        await buildWorkbench(mi)
      ) {
        await updateState('success');
      } else {
        await updateState('error');
      }
    } catch(e) {
      await updateState('error');
      console.error(e.message);
    }
  });

  while (queue.length) {
    await queue.shift()!();
  }

  ctx.response.status = 200;
});

app
  .use(bodyParser({
    jsonLimit: '40mb',
    textLimit: '40mb'
  }))
  .use(router.routes())
  .use(router.allowedMethods());

const httpServer = http.createServer(app.callback());

httpServer.listen(params.buildServerPort, () => console.info(`>>> HTTP server is running at http://localhost:${params.buildServerPort}`) );

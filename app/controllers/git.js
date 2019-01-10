var path = require('path')

var config = require(path.join(__dirname, '../config'))
var Log = require(path.join(config.path.fish, 'log'))
var Email = require(path.join(config.path.root, 'lib/Email.js'))

// @todo: 需要在基类定义
var actions = {
    params: {},
    test: function () {
        var log = new Log(this.params)
        log.info('git 提交日志')
        return '日志已生成'
    },
    pull: async function () {
        let email = new Email('353740902@qq.com');
        let res =  await email.send('node-web 有新的提交需要更新', '有新的提交需要更新');
        var log = new Log(this.params)
        log.info('有新的提交已被拉取，邮件已发送')
        return '日志已生成'
    },
    pullrequest: async function () {
        // var aaa = '{"ref":"refs/heads/master","before":"dcefdb3805d161b2da28308a13167c0f48e1122a","after":"48766de1313ba946e9737cd1b76a3b9a6ee55c29","created":false,"deleted":false,"forced":false,"base_ref":null,"compare":"https://github.com/fishcg/node-web/compare/dcefdb3805d1...48766de1313b","commits":[{"id":"48766de1313ba946e9737cd1b76a3b9a6ee55c29","tree_id":"c3a6bedc2030088888df6890223ff62ec35c1f0d","distinct":true,"message":"ignore-log-file","timestamp":"2018-11-14T15:58:15+08:00","url":"https://github.com/fishcg/node-web/commit/48766de1313ba946e9737cd1b76a3b9a6ee55c29","author":{"name":"fishcg","email":"353740902@qq.com","username":"fishcg"},"committer":{"name":"fishcg","email":"353740902@qq.com","username":"fishcg"},"added":[],"removed":["app/runtime/app.log"],"modified":[".gitignore"]}],"head_commit":{"id":"48766de1313ba946e9737cd1b76a3b9a6ee55c29","tree_id":"c3a6bedc2030088888df6890223ff62ec35c1f0d","distinct":true,"message":"ignore-log-file","timestamp":"2018-11-14T15:58:15+08:00","url":"https://github.com/fishcg/node-web/commit/48766de1313ba946e9737cd1b76a3b9a6ee55c29","author":{"name":"fishcg","email":"353740902@qq.com","username":"fishcg"},"committer":{"name":"fishcg","email":"353740902@qq.com","username":"fishcg"},"added":[],"removed":["app/runtime/app.log"],"modified":[".gitignore"]},"repository":{"id":140150950,"node_id":"MDEwOlJlcG9zaXRvcnkxNDAxNTA5NTA=","name":"node-web","full_name":"fishcg/node-web","private":false,"owner":{"name":"fishcg","email":"353740902@qq.com","login":"fishcg","id":26989449,"node_id":"MDQ6VXNlcjI2OTg5NDQ5","avatar_url":"https://avatars1.githubusercontent.com/u/26989449?v=4","gravatar_id":"","url":"https://api.github.com/users/fishcg","html_url":"https://github.com/fishcg","followers_url":"https://api.github.com/users/fishcg/followers","following_url":"https://api.github.com/users/fishcg/following{/other_user}","gists_url":"https://api.github.com/users/fishcg/gists{/gist_id}","starred_url":"https://api.github.com/users/fishcg/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/fishcg/subscriptions","organizations_url":"https://api.github.com/users/fishcg/orgs","repos_url":"https://api.github.com/users/fishcg/repos","events_url":"https://api.github.com/users/fishcg/events{/privacy}","received_events_url":"https://api.github.com/users/fishcg/received_events","type":"User","site_admin":false},"html_url":"https://github.com/fishcg/node-web","description":"node 服务器","fork":false,"url":"https://github.com/fishcg/node-web","forks_url":"https://api.github.com/repos/fishcg/node-web/forks","keys_url":"https://api.github.com/repos/fishcg/node-web/keys{/key_id}","collaborators_url":"https://api.github.com/repos/fishcg/node-web/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/fishcg/node-web/teams","hooks_url":"https://api.github.com/repos/fishcg/node-web/hooks","issue_events_url":"https://api.github.com/repos/fishcg/node-web/issues/events{/number}","events_url":"https://api.github.com/repos/fishcg/node-web/events","assignees_url":"https://api.github.com/repos/fishcg/node-web/assignees{/user}","branches_url":"https://api.github.com/repos/fishcg/node-web/branches{/branch}","tags_url":"https://api.github.com/repos/fishcg/node-web/tags","blobs_url":"https://api.github.com/repos/fishcg/node-web/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/fishcg/node-web/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/fishcg/node-web/git/refs{/sha}","trees_url":"https://api.github.com/repos/fishcg/node-web/git/trees{/sha}","statuses_url":"https://api.github.com/repos/fishcg/node-web/statuses/{sha}","languages_url":"https://api.github.com/repos/fishcg/node-web/languages","stargazers_url":"https://api.github.com/repos/fishcg/node-web/stargazers","contributors_url":"https://api.github.com/repos/fishcg/node-web/contributors","subscribers_url":"https://api.github.com/repos/fishcg/node-web/subscribers","subscription_url":"https://api.github.com/repos/fishcg/node-web/subscription","commits_url":"https://api.github.com/repos/fishcg/node-web/commits{/sha}","git_commits_url":"https://api.github.com/repos/fishcg/node-web/git/commits{/sha}","comments_url":"https://api.github.com/repos/fishcg/node-web/comments{/number}","issue_comment_url":"https://api.github.com/repos/fishcg/node-web/issues/comments{/number}","contents_url":"https://api.github.com/repos/fishcg/node-web/contents/{+path}","compare_url":"https://api.github.com/repos/fishcg/node-web/compare/{base}...{head}","merges_url":"https://api.github.com/repos/fishcg/node-web/merges","archive_url":"https://api.github.com/repos/fishcg/node-web/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/fishcg/node-web/downloads","issues_url":"https://api.github.com/repos/fishcg/node-web/issues{/number}","pulls_url":"https://api.github.com/repos/fishcg/node-web/pulls{/number}","milestones_url":"https://api.github.com/repos/fishcg/node-web/milestones{/number}","notifications_url":"https://api.github.com/repos/fishcg/node-web/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/fishcg/node-web/labels{/name}","releases_url":"https://api.github.com/repos/fishcg/node-web/releases{/id}","deployments_url":"https://api.github.com/repos/fishcg/node-web/deployments","created_at":1531038986,"updated_at":"2018-11-14T07:55:16Z","pushed_at":1542182303,"git_url":"git://github.com/fishcg/node-web.git","ssh_url":"git@github.com:fishcg/node-web.git","clone_url":"https://github.com/fishcg/node-web.git","svn_url":"https://github.com/fishcg/node-web","homepage":null,"size":4767,"stargazers_count":0,"watchers_count":0,"language":"JavaScript","has_issues":true,"has_projects":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"archived":false,"open_issues_count":0,"license":null,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","stargazers":0,"master_branch":"master"},"pusher":{"name":"fishcg","email":"353740902@qq.com"},"sender":{"login":"fishcg","id":26989449,"node_id":"MDQ6VXNlcjI2OTg5NDQ5","avatar_url":"https://avatars1.githubusercontent.com/u/26989449?v=4","gravatar_id":"","url":"https://api.github.com/users/fishcg","html_url":"https://github.com/fishcg","followers_url":"https://api.github.com/users/fishcg/followers","following_url":"https://api.github.com/users/fishcg/following{/other_user}","gists_url":"https://api.github.com/users/fishcg/gists{/gist_id}","starred_url":"https://api.github.com/users/fishcg/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/fishcg/subscriptions","organizations_url":"https://api.github.com/users/fishcg/orgs","repos_url":"https://api.github.com/users/fishcg/repos","events_url":"https://api.github.com/users/fishcg/events{/privacy}","received_events_url":"https://api.github.com/users/fishcg/received_events","type":"User","site_admin":false}}'
        let payload = JSON.parse(this.params.request.post.payload);
        let committer = payload.commits[0].committer
        let email = new Email(committer.email);
        await email.send('node-web 已收到您的 PR', '啦啦啦啦' + committer.name);
        var log = new Log(this.params)
        log.info('新的 PR')
        return '日志已生成'
    },
}

exports.actions = actions
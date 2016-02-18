import xhr from 'xhr';

export const ADD_USER = 'ADD_USER';
export const LOAD_USER = 'LOAD_USER';
export const LOAD_REPOSITORY = 'LOAD_REPOSITORY';
export const LOAD_DIFF = 'LOAD_DIFF';

const github = 'https://api.github.com/';

export const addUser = function(username, repo) {
    return {
        type: ADD_USER,
        username: username,
        repo: repo || null
    };
};

export const loadUser = function(username) {
    return function(dispatch) {
        let url = github + 'users/' + username + '/repos';
        xhr.get(url, {json: true}, function(error, response, body) {
            dispatch({
                type: LOAD_USER,
                username: username,
                repositories: body
            });
        });
    };
};

export const loadRepository = function(username, repo) {
    return function(dispatch) {
        let url = github + 'repos/' + username + '/' + repo + '/commits';
        xhr.get(url, {json: true}, function(error, response, body) {
            dispatch({
                type: LOAD_REPOSITORY,
                username: username,
                repo: repo,
                commits: body
            });
        });
    };
};

export const loadDiff = function(username, repo, sha) {
    return function(dispatch) {
        let url = github + 'repos/' + username + '/' + repo + '/commits/' + sha;
        xhr.get(url, {json: true}, function(error, response, body) {
            dispatch({
                type: LOAD_DIFF,
                username: username,
                repo: repo,
                sha: sha,
                diff: body
            });
        });
    };
};

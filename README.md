# Class 4: Beyond React
Welcome to our last session together! We've gone over quite a bit up to this point, from **[setting up a development environment](https://github.com/ryanmcgrath/webpack-babel-react-setup-lesson)** (with Webpack/Babel/React), to data storage and architecture (**[Flux & Redux](https://github.com/ryanmcgrath/react-flux-redux-lesson)**), and **[creating true Single Page Applications with React Router](https://github.com/ryanmcgrath/react-router-lesson)**. In this session, we'll take a look at the following, and add some final functionality to our GitHub repository viewer:

- Integrating Non-React libraries into React applications
- React "Best Practices"


## Integrating Non-React Libraries into React Applications
The React ecosystem is pretty large already, even for a (relatively) new development environment. Sadly, there are some great and useful components out there that aren't really React-friendly. Integrating them can be a common source of confusion, usually due to one of the following:

- React tends to focus on the Virtual DOM as the representative DOM model, instead of the real one.
- React has a built-in event management system, but it's coupled to `React.Component` instances.
- When using ES6, it's easy to see everything as a `Class`, but traditionally JS development has been touch and go with this.

The immediate first thought many have is to try and apply the React way to non-React libraries, but this usually results in a difficult to reason about setup. A better way is to treat them completely separately - manage the lifecycle of the non-React libraries from your React components, which tend to be UI-centric anyway, and only bring in the non-React libraries when the actual DOM is involved.

We'll go ahead and take a look at implementing a third-party syntax highlighter (the classic **[highlight.js](https://github.com/isagalaev/highlight.js)**), coupled with a way to actually view the patches associated with the changes in our GitHub Repo viewer. We'll need to do the following:

- Add a new Route into our Router.
- Define a `DiffView`, which manages presenting the patch data from a GitHub changeset as multiple files.
- Update our Store and Actions to account for the new data to display.
- Define a `FileView`, which manages the individual File view.
- Add syntax highlighting to `FileView`.

This touches on everything in the past few sessions, so feel free to take a minute and review if you need it!

### Adding Our New Route
In terms of the GitHub API, we need to provide a SHA from the commit. Thankfully, this is already present, so our route is pretty easy. Open up **app.js** and let's turn it into the following:

``` javascript
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';
import RepositoryIndex from './components/repository-index';
import RepositoryList from './components/repository-list';
import DiffView from './components/diff-viewer';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    getChildContext() {
        return {params: this.props.params};
    }

    handleSubmit(e) {
        e.preventDefault();
        let username = this.refs.input.value;
        browserHistory.push('/' + username);
    }

    render() {
        return (
            <div id="app_wrapper">
                <form method="get" action="/" onSubmit={this.handleSubmit}>
                    <input type="text" ref="input" placeholder="Enter a GitHub username and hit enter" />
                </form>
                {this.props.children}
            </div>
        );
    }
}

App.childContextTypes = {params: React.PropTypes.object};


render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <Route path=":username" component={RepositoryList} />
            <Route path=":username/:repository" component={RepositoryIndex} />
            <Route path=":username/:repository/:sha" component={DiffView} />
        </Route>
    </Router>
), document.getElementById('app'));
```

There's only two new changes here from the last session:

- We're importing a new `DiffView` component, which we'll create in just a moment.
- On `/:username/:repository/:sha`, we'll display our DiffView.

Just to make sure everything builds and is view-able without error, we'll stub out a DiffView really quickly. Open up **src/components/diff-view.js** and throw in a basic component, like below.

``` javascript
import React from 'react';

class DiffView extends React.Component {
    render() { return <div></div>; }
}

export default DiffView;
```

### Updating Store and Actions
Now we need to actually grab the data from GitHub. A quick refresher on our current data stack indicates we've got a JSON structure like the one below:

``` javascript
{
    username: {
        repository: ["commits..."]
    }
}
```

Since we'll be storing patch data and we've got the SHA it's associated with, let's rethink our structure to be more like this:

``` javascript
{
    username: {
        repository: {
            commits: [],
            sha: {}
        }
    }
}
```

We'll store the `commits` as an Array on the repository, rather than the direct key repository. Each SHA then becomes a separate key, indicating the patch it describes. With that bit of modeling design out of the way, we can now update our store and actions - let's start with `store/actions.js`:

``` javascript
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
```

Very similar to what we did in the last few sessions - we've got a new `LOAD_DIFF` constant, and a corresponding `loadDiff` function. `loadDiff` is returning a `redux-thunk` style action, and just handles calling and returning the GitHub API for commit data. `LOAD_DIFF` leads us over to **src/store/store.js**:

``` javascript
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk'; 
import xhr from 'xhr';
import {ADD_USER, LOAD_USER, LOAD_REPOSITORY, LOAD_DIFF} from './actions';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

const store = createStoreWithMiddleware(function(state, action) {
    let newState = Object.assign({}, state);
    
    switch(action.type) {
        case ADD_USER:
            if(!newState[action.username])
                newState[action.username] = {};

            if(action.repo && !newState[action.username][action.repo])
                newState[action.username][action.repo] = {};
                
            return newState;

        case LOAD_USER:
            action.repositories.forEach(function(repository) {
                newState[action.username][repository.name] = repository;
            });
            return newState;

        case LOAD_REPOSITORY:
            newState[action.username][action.repo].commits = action.commits;
            return newState;
        
        case LOAD_DIFF:
            newState[action.username][action.repo][action.sha] = action.diff;
            return newState;

        default:
            return state
    }
}, {});

export default store;
```

A few things worth noting here:

- We've updated our `ADD_USER` case.
  - Originally we only had two screens to concern ourselves with, but now we're adding a third. `ADD_USER` is hit on each `componentDidLoad` call, just to ensure that we've got default entries in our store before the latter cases.
- Our `LOAD_REPOSITORY` case now stores the commits on a `commits` key, like we went over above.
- `LOAD_DIFF` stores the change data on a SHA key.

Other than that, there's nothing too new here. We're now good to go on the data front though!

### Patching in a Few Things
Before we touch our `DiffView` and `FileView` components, we should make sure the rest of the application is up to snuff since our data model has changed. Crack open **src/components/repository-index.js**:

``` javascript
import React from 'react';
import store from '../store/store';
import {addUser, loadRepository} from '../store/actions';
import CommitMessage from './commit-message';

class RepositoryIndex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {history: []};
        this.updateRepo = this.updateRepo.bind(this);
    }

    componentDidMount() {
        store.dispatch(addUser(this.props.params.username, this.props.params.repository));
        this.unsubscribe = store.subscribe(this.updateRepo);
        store.dispatch(loadRepository(this.props.params.username, this.props.params.repository));
    }

    componentWillReceiveProps(newProps) {
        store.dispatch(loadRepository(newProps.params.username, newProps.params.repository));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    updateRepo(history) {
        let data = store.getState()[this.props.params.username];
        if(data[this.props.params.repository])
            data = data[this.props.params.repository].commits;
        else
            data = [];

        this.setState({history: [].concat(data)});
    }

    render() {
        let props = this.props;
        return <ul className="repository">
            <h1>Showing Recent Commits on {this.props.params.username}/{this.props.params.repository}</h1>
            {this.state.history.map(function(commit, i) {
                return <CommitMessage commit={commit} key={i} {...props} />;
            })}
        </ul>;
    }
};

export default RepositoryIndex;
```

Again, only relatively small changes here.

- We've swapped our `addUser` call to include the repository name, since we've got it at this point and it's worth setting the default.
- In our `updateRepo` method, we're grabbing the commit list from the new `commits` key on the repository.
- In our `render` method, we're passing our `props` down the chain with a splat operator (`{...props}`).

We'll also need to swap a line in our `CommitMessage` component, to enable linking to the patch itself:

``` javascript
import React from 'react';
import {Link} from 'react-router';

var defaultGravatar = 'http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y';

class CommitMessage extends React.Component {
    render() {
        let avatar = this.props.commit.author ? this.props.commit.author.avatar_url : defaultGravatar,
            d = new Date(this.props.commit.commit.author.date),
            url = '/' + this.props.params.username + '/' + this.props.params.repository + '/' + this.props.commit.sha;

        return (<li className="commit">
            <img src={avatar} width="50" height="50" />
            <h2 className="author">{this.props.commit.commit.author.name}</h2>
            <Link to={url} className="message">{this.props.commit.commit.message}</Link>
            <p className="date">{d.toTimeString()}</p>
        </li>);
    }
}

export default CommitMessage;
```

Now we can finally knock out our `DiffView` and `FileView` components in full!


### Bringing it all together
Let's jump back to **src/components/diff-view.js**, since we can actually load the data from GitHub now.

``` javascript
import React from 'react';
import {addUser, loadDiff} from '../store/actions';
import store from '../store/store';
import FileView from './file-view';

class DiffView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {diff: {files: []}};
        this.updateSource = this.updateSource.bind(this);
    }

    componentDidMount() {
        store.dispatch(addUser(
            this.props.params.username,
            this.props.params.repository
        ));
        this.unsubscribe = store.subscribe(this.updateSource);
        store.dispatch(loadDiff(
            this.props.params.username,
            this.props.params.repository,
            this.props.params.sha
        ));
    }

    componentWillReceiveProps(newProps) {
        store.dispatch(loadDiff(
            newProps.params.username,
            newProps.params.repository,
            newProps.params.sha
        ));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    updateSource(source) {
        let username = this.props.params.username,
            repo = this.props.params.repository,
            sha = this.props.params.sha,
            diff = store.getState()[username][repo][sha];

        this.setState({diff: diff});
    }

    render() {
        return (
            <div className="diff-container">
                <h1>Commit {this.props.params.sha} on {this.props.params.username}/{this.props.params.repository}</h1>
                {this.state.diff.files.map(function(file, i) {
                    return <FileView file={file} key={i} />;
                })}
            </div>
        );
    }
}

export default DiffView;
```

By now, you can probably look at this and read it top to bottom with ease - we're just taking our new actions, hooking up our `DiffView` component to our `store`, and enabling the rendering lifecycle akin to what we did with `repository-list.js` and `repository-index.js`. Of note is `FileView`, in our `render` method, which we need to knock together now. Open up **src/components/file-view.js**:

``` javascript
import React from 'react';

class FileView extends React.Component {
    render() {
        return (<div className="file-view">
            <pre ref="source">{this.props.file.patch}</pre>
            <div className="file-name">{this.props.file.filename}</div>
        </div>);
    }
};

export default FileView;
```

With this, we've got our application rendering out patches respective to each commit. It's pretty ugly, though - code is easier to reason about with syntax highlighting, so let's get on with it.

### Adding in highlight.js
The only component we'll need to modify here is **src/components/file-view.js**. We'll make use of `highlight.js`, a well-tested and versatile library for automatically applying syntax highlighting to portions of code. It's not a React component by default, but we can easily integrate it by making use of React's lifecycle methods. Install it by way of (you guessed it) npm:

``` sh
npm install --save highlight.js
```

Import the library, and add a `componentDidMount` method into **src/components/file-view.js**, to handle the highlighting itself:

``` javascript
import React from 'react';
import hljs from 'highlight.js';

class FileView extends React.Component {
    componentDidMount() {
        hljs.highlightBlock(this.refs.source);
    }

    render() {
         return (<div className="file-view">
            <pre ref="source">{this.props.file.patch}</pre>
            <div className="file-name">{this.props.file.filename}</div>
        </div>);      
    }
};

export default FileView
```

Ordinarily, `highlightBlock` only works with existing DOM Nodes on the page. `componentDidMount` is typically where you want to handle non-React library usage, as the DOM node is guaranteed to be accessible then (via `refs`, which we do here: `this.refs.source`). Thanks to this, we're able to pass an actual DOM Node to `highlight.js` and let it take over as usual.

Now, in some cases, if your component is one that may re-render at arbitrary points, you'll need to handle keeping the third party library in-sync. For instance, if you wanted to utilize a jQuery UI setup, you'd likely want to wrap each widget in a React component dedicated to managing the lifespan and rendering of the widget.

> jQueryUI is one example, of course - many old-school JS libraries (such as Fine-Uploader) are useless without DOM access, but lack comparable React components. Knowing how to integrate them via the lifecycle methods is key to making the best of the old and new.

### Appearance
If you've checked out our application now, you should be able to see the changes. They're probably lacking the actual... highlighting, though. For this we need to include some CSS, but thanks to our development server setup this is pretty straightforward. Open up **index.html** and add the following CSS import:

``` html
<link rel="stylesheet" type="text/css" media="all" href="/node_modules/highlight.js/styles/default.css">
```

> `highlight.js` includes a number of CSS files that you can reference, but we're just using the default. Check them out though!

Now we've got a decent looking screen that's actually decipherable! 

## Best Practices with React
We've got an end-to-end application built and working, but we'll finish up our lesson with a look at best practices with React as of 2016. The landscape is constantly changing and improving, so it can be tough to wade through all the information out there - here's a few big points to remember as you move forward.

- **Object Comparisons**  
  Throughout our application, we use `Object.assign` in a few different places. We do this because it enables a deep comparison, which is much faster than checking object equality in full. As your application grows, you'll end up implementing the `shouldComponentUpdate` lifecycle method on some components. Speed matters here due to how often this is called! A good library to help with this is **[ImmutableJS](https://facebook.github.io/immutable-js/)**, also from Facebook.
  
- **When in Doubt, Components!**  
  It's easy to build up highly nested HTML structures in JSX; it feels natural and is pretty fast to write. This can be a bit messy as time goes on though, as your component becomes crowded with callback methods and nested props/state structures. Don't be afraid to split things up into smaller sub-components - the logic splitting and modularity will be very useful down the road.
  
- **Favor Props over State**  
  We've been pretty good about this so far - our rendering, routing and so on is driven largely by props. We do use the state for shallow copies of store data, simply for rendering, but we're not relying on it for anything beyond that. The entire application becomes easier to reason about, a very top-down approach.
  
- **Instance Properties vs State**  
  Components don't _need_ to store instance-specific variables in State, but it can be helpful to have a specific place where everyone knows to look. `this.setState` will also ensure a rendering pass occurs, whereas updating an instance variable won't ensure it.
  
- **Use ES6**  
  Boning up on ES6 (and ES7, if you go further and enable Babel/Webpack to use even newer features) can make your code much more reusable and succinct.

- **Stay up to date**  
  React (and the accompanying ecosystem) changes rapidly, and it helps to stay up to date. A few good resources are the **[Official React Blog](https://facebook.github.io/react/blog/)**, or the **[React Newsletter](http://reactjsnewsletter.com/)**.
  
- **Testing**  
There's a number of different ways to test React applications, and luckily not all of them require a browser to run with. **[Jest, from Facebook](https://facebook.github.io/jest/docs/tutorial-react.html)** is one good approach - the initial guide is good for getting set up quickly, and it's a fairly widely used library if you find yourself with questions. If you've got existing testing solutions in place (such as Mocha), it's also possible to **[integrate React](https://github.com/jesstelford/react-testing-mocha-jsdom)** testing with it.


## Wrapping Up
We've gone over a lot in the last few weeks - setting up a development environment, Flux (and Redux), routing in React, and more. You're set up to go on and build full React Single Page Applications now! I'm always available for questions or advice - feel free to get in touch!

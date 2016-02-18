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

Depending on your target user, accessibility could always be a big focus, and most React components floating around today don't place much value on this. A good example is jQuery UI, a library that many rely on due to it's focus on accessibility. What if we wanted to use, say, the **[jQuery UI Slider](https://jqueryui.com/slider/)** in our application? What we'd want to do is build a React Component solely dedicated to managing it.

We'll use our existing project to implement this, but first, let's add jQuery and jQuery UI as dependencies. These don't tend to work too well with a Webpack based setup, but it's certainly possible to do so - we'll

# Class 3: Integrating Routing into a React Single-Page Application
Welcome back! In our last session we took a look at how to manage data storage in React applications, examining a basic Flux architecture and talking about what third-party Flux offerings bring to the table. We built a basic network-enabled GitHub commit viewer, using the `xhr` library with `redux` as our backing store. Now, we'll see how to build a more expansive React application, including:

- An introduction to `react-router`
- Integrating `react-router` with our Github Repo Viewer

Let's get right into it!

## An Introduction to React Router
Complex applications have more than just a single screen. Traditional web development stacks use a full-reload process; you click a link, and the browser reloads the entire page based on the response from the server. When you're building a single-page architecture, this isn't ideal - each new request will download the same files over and over again, just to display your app. To avoid this, we want to handle routing concerns on the client side - when a link is clicked, we should catch it and react accordingly.

As a quick review, our current GitHub repository viewer has a structure like the below:

- `src`
  - `app.js`
  - `components`
    - `repository-index.js`
    - `commit-message.js`
  - `stores`
    - `actions.js`
    - `store.js`

We only have one main component at the moment (`components/repository-index.js`), but as we add new ones we need a solution for catching URL actions. Enter **[React Router](https://github.com/rackt/react-router)**, a project that integrates routing into React applications with ease. It abstracts out many tedious and sometimes difficult tasks, such as handling URL changes and interfacing with React component lifecycle methods to enable proper loading.

### A Basic Routing Structure
Let's see how our current application would integrate routing. To follow along, you'll want to install react router:

``` bash
npm install --save react-router
```

Now we just need to add a few imports, and change our render method ever so slightly:

``` javascript
import React from 'react';
import {render} from 'react-dom';
import {Router, Route} from 'react-router';
import RepositoryIndex from './components/repository-index';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {username: 'ryanmcgrath', repo: 'twython'};
        this.handleKeyEvent = this.handleKeyEvent.bind(this);
    }
    
    handleKeyEvent(e) {
        if(e.key !== 'Enter')
            return;

        var data = this.refs.input.value.split('/');
        if(data.length !== 2)
            return alert('Bad input.');

        this.setState({
            username: data[0],
            repo: data[1]
        });
    }

    render() {
        return (<div id="app_wrapper">
            <input type="text" ref="input" placeholder={this.state.username + "/" + this.state.repo} onKeyUp={this.handleKeyEvent} />
            <RepositoryIndex username={this.state.username} repo={this.state.repo} />
        </div>);
    }
}

render((
    <Router>
        <Route path="/" component={App} />
    </Router>
), document.getElementById('app'));
```

The `Router` and `Route` objects are just React components, at the end of the day - we can just pass them to the `render` method. We pass our App as the index route; as we move to add new routes we have a simple point to do so. The Router handles catching the URL and checking to see if we should render a different component, including capturing URL components and passing them as props down the component chain. All your standard React lifecycle methods behave as they should, making the entire stack very straightforward to reason about.

### A Few Useful Things
There's a few intricacies in regards to what `react-router` brings to the table that are worth reviewing. Some of the other components worth knowing about are:

- `<Link>`  
  A component that you can use in your custom component to generate fully-qualified links that work with your routing structure. In addition, it'll detect when a link that's been clicked is considered "active", which helps the UI side of things if you'd like to light up a navigation item or display a tree of some sort. Passing the standard `id`, `className` and so on will ensure they get passed to the generated `<a></a>` HTML.
  
- `<IndexLink>`  
  Similar to `<Link>`, but will be considered "active" only when the exact route is matched - `<Link>` treats routes below your route as active as well.
  
- `<Redirect>`  
  URLs in applications can change as time goes on. As your application grows, hunting down where your URLs are nestled in your code and updating them can be tricky, and this only grows as multiple people touch the codebase. `<Redirect>` will ensure that an old URL passes over to the new one, in one central location.
  
  You'd use it something like this:
  
  ``` javascript
  <Redirect from="old_url" to="new_url" />
  ```
  
- `<IndexRoute>`  
  A simple way to provide a default route to a parent route. A use case for this would be if we wanted to have multiple sub-routes of `/`, but render something specifically on the root `/`.

### Injected Properties
React Router keeps a few properties handy, and injecting specific properties into your component structure provides you a few useful pieces:

- **location**  
  A location object that's conceptually similar to `window.location`, but with a few extra things behind the scenes for React Router use-cases.
  
- **params**  
  URL parameters, useful for passing pieces of data around. For instance, if your URL was '/users/user/1', and your url configuration was '/users/user/:userid', then in your component `this.props.params` would be `{userid: 1}`.
  
- **route**  
  The route that's rendering your component. Useful for debugging purposes.

### History
History in React Router is taken care of by a library (aptly) known as **[history](https://github.com/rackt/history)**, which maps over the differences in browsers that tend to complicate URL routing in client-side applications. For the most part you can set-and-forget with this, but there are three different ways to use history in React Router that have their uses:

- **browserHistory**  
  The default history store that you'll work with, which uses the built-in `History` API found in modern browsers. IE9 and below don't support this API, though, so if you need to support these browsers you'll want to look at the next item...
  
- **hashHistory**  
  Whereas `browserHistory` uses the shiny new `History` API to do clean URL structures, `hashHistory` builds... uglier, but functional ones. These will work in IE9 and below, looking akin to `/#/my/url/state`. They're not ideal for users to remember, and technically are a bit of a hack, but they work.
  
- **createMemoryHistory**  
  A history shim that doesn't require a browser. Useful for testing, or environments like React Native.


## Enhancing our GitHub Repository Viewer
The project we've been hacking on so far has been a bit limited in scope - Flux came along in session 2 and gave us data storage capabilities, but there's no real interactivity besides typing in a `username/repository` combination. Let's use React Router to simplify this - instead of having to supply a combination, we'll make it so all you have to do is supply a username, and the repositories for that user will be listed out. Clicking on one will show the recent commit log for that repository.

Let's refine our `app.js` file first, as it's the entry point where everything boots off of. We'll be creating a new component shortly, called `RepositoryList`, so we'll import it here in preparation - it's just a view that lists repositories for a given username. We also add in an extra import from `react-router` to grab `browserHistory`; this is a provided singleton that makes life easier when dealing with the History interface, and allows us to push a new URL entry onto the History stack as well, triggering a React Router update in the process.

We'll also swap out our ad-hoc `onKeyUp` function for a more robust form `onSubmit`; when this occurs, we push the username onto our browser history stack to navigate to it. 

``` javascript
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';
import RepositoryIndex from './components/repository-index';
import RepositoryList from './components/repository-list';

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
        </Route>
    </Router>
), document.getElementById('app'));
```

There's a few things to take note of here:

- In our `<App/>` component, we explicitly include `{this.props.children}` in the render method. Route's are just React.Component instances themselves, and `<App />` is like the base of the application - for each url that's hit, React Router will pass our desired component as a child to `<App />`. Doing so just ensures the rendering chain takes place.
  
- `getChildContext` is a slightly more advanced feature in React, known as **[Contexts](https://facebook.github.io/react/docs/context.html)**. A parent component (in this case, our `<App />`) can provide default properties to every child it contains. This is useful for emulating global variables or shared data while keeping it confined to one React tree, and React Router uses it to pass `params` down the chain. This allows us to pull URL properties and variables in our child components.

- We set `childContextTypes` on `App`; this is just informing React how our properties will look.
  
- Our Router structure is simple, but very flexible - on `/:username` we'll list repositories for that user, and on `/:username/:repository` we'll load the commits for that repository.

Now, we'll need a few other pieces in place for this all to work. Create `src/components/repository-list.js` next, so our imports don't blow up - this will be barebones, but we'll come back to it after hitting our data layer:

``` javascript
import React from 'react';
import RepositoryLink from './repository-link';

class RepositoryList extends React.Component {
    render() {
        return (<div id="repository-list">
            <h1>Showing Repositories {this.props.params.username} Contributes To:</h1>
        </div>);
    }
}

export default RepositoryList;
```

And go ahead and create `src/components/repository-link.js` as well:

``` javascript
import React from 'react';
import {Link} from 'react-router';

class RepositoryLink extends React.Component {
    render() {
        let url = this.props.repo.owner.login + '/' + this.props.repo.name;
        return (
            <Link to={url} className="repo-link">
                <h2>{url}</h2>
                <p>{this.props.repo.description}</p>
                <p><small>{this.props.repo.watchers_count} Watchers</small></p>
            </Link>
        );
    }
};

export default RepositoryLink;
```

This component is one we can scaffold ahead of time, as the **[data structure for a repository](https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository)** is documented. We'll show the `username/repo` combo, the description of the repository, and a watchers count.

### More Data Fetching
Now that we've got a basic hold on how our UI structure is getting set up, we'll need to add alter our `actions` and `store` a bit to accommodate this. First up, `src/store/actions.js`:

``` javascript
import xhr from 'xhr';

export const ADD_USER = 'ADD_USER';
export const LOAD_USER = 'LOAD_USER';
export const LOAD_REPOSITORY = 'LOAD_REPOSITORY';

const github = 'https://api.github.com/';

export const addUser = function(username) {
    return {
        type: ADD_USER,
        username: username
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
        let url = 'https://api.github.com/repos/' + username + '/' + repo + '/commits';
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
```

This may look like old territory after session 2, but it's useful all the same.

- A few new constants are necessary - `ADD_USER` and `LOAD_USER`.
  
- We've got two new actions as well - `addUser`, which just standardizes the format for adding a user, and `loadUser`, which is a `redux-thunk` action like `loadRepository`. In there we simply construct our URL and load the repositories.
  
- We also abstract out the GitHub domain into a variable.

> You might wonder why we have two separate methods for adding a user, and loading a user. The reason is because our data structure relies on the username being present, and now we've got two different views that could be loaded - a user could refresh the browser entirely on `/:username/:repository`, and we should load the commits for that repository. `addUser` simply ensures that an entry for the username always exists in our Redux tree, so that `LOAD_USER` and `LOAD_REPOSITORY` need not care about this logic.

Now let's flip over to the companion to this file, `src/store/store.js`:

``` javascript
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk'; 
import xhr from 'xhr';
import {ADD_USER, LOAD_USER, LOAD_REPOSITORY} from './actions';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

const store = createStoreWithMiddleware(function(state, action) {
    let newState = Object.assign({}, state);
    
    switch(action.type) {
        case ADD_USER:
            if(!newState[action.username])
                newState[action.username] = {};
            return newState;

        case LOAD_USER:
            action.repositories.forEach(function(repository) {
                newState[action.username][repository.name] = repository;
            });
            return newState;

        case LOAD_REPOSITORY:
            newState[action.username][action.repo] = action.commits;
            return newState;
        
        default:
            return state
    }
}, {});

export default store;
```

Thanks to Redux, this all stays pretty smooth - we've got two new cases to deal with. `ADD_USER` is just logic ensuring that our username exists, and `LOAD_USER` iterates over our returned repository list and stores it on the user by key. This is one way to do it - you could also substitute the repositories Object for an Array, for instance. Feel free to play around with it.

### Back to the Views
With our data layer sorted out, we can finish stringing together our view components. Thanks to React Router, our `RepositoryList` now gets the `username` from the URL, so we'll head back there to hook up the data layer. Open up `src/components/repository-list.js`:

``` javascript
import React from 'react';
import store from '../store/store';
import {addUser, loadUser} from '../store/actions';
import RepositoryLink from './repository-link';

class RepositoryList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {repositories: []};
        this.updateList = this.updateList.bind(this);
    }

    componentDidMount() {
        store.dispatch(addUser(this.props.params.username));
        this.unsubscribe = store.subscribe(this.updateList);
        store.dispatch(loadUser(this.props.params.username));
    }

    componentWillReceiveProps(newProps) {
        store.dispatch(addUser(newProps.params.username));
        store.dispatch(loadUser(newProps.params.username));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }
    
    updateList() {
        let user = store.getState()[this.props.params.username],
            repositories = [];

        Object.keys(user).forEach(function(key, i) {
            repositories.push(Object.assign({}, user[key]));
        });

        this.setState({
            repositories: repositories
        });
    }

    render() {
        return (<div id="repository-list">
            <h1>Showing Repositories {this.props.params.username} Contributes To:</h1>
            {this.state.repositories.map(function(repo, i) {
                return <RepositoryLink repo={repo} key={i} />;
            })}
        </div>);
    }
}

export default RepositoryList;
```

We're just doing the usual lifecycle methods, harkening back to session 2. The important pieces are...

- On `componentDidMount()` and `componentWillReceiveProps()`, we fire off an action to ensure our user record exists before loading up the user data.
  
- `updateList()` is where the bulk of the magic happens; to make the `render()` method more succinct, we transform the repositories Object into a flat Array that we can just map over.

After that, our first two screens should load A-OK! Give it a whirl with `npm start` and check it out - you should be able to type in a username and get their repository list back. If you'd like some presentable CSS, there's an `app.css` file in the root of this repository that you're more than welcome to grab.

### Bringing RepositoryIndex Back
The last part we need to hit is `RepositoryIndex`, which we created back in session 2. There's not many huge changes here, other than swapping out property reference names to work with React Router. We'll go ahead and add an `addUser` action call here as well, in case a user were to reload while on this view, and make our `updateRepo()` method a bit more succinct:

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
        store.dispatch(addUser(this.props.params.username));
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
            data = data[this.props.params.repository];
        else
            data = [];

        this.setState({history: [].concat(data)});
    }

    render() {
        return <ul className="repository">
            <h1>Showing Recent Commits on {this.props.params.username}/{this.props.params.repository}</h1>
            {this.state.history.map(function(commit, i) {
                return <CommitMessage commit={commit} key={i} />;
            })}
        </ul>;
    }
};

export default RepositoryIndex;
```

## Finishing Up
And voilà! Our GitHub repository viewer is now router-enabled. You should be able to load up a user, see their repositories, and read the latest commits for a given repository. One final change we can also make to our project is to enable the `historyApiFallback` option in `webpack.config.js` - by default, a user reloading on `/:username/repository` will get a 404. Since this is just development, you're likely the only user; not a huge deal, but it can be annoying to deal with.

In your `devServer` option in `webpack.config.js`, add `historyApiFallback: true`:

``` javascript
    // Configure our development server
    config.devServer = {
        contentBase: __dirname,
        hot: true,
        progress: true,
        stats: 'errors-only',
        host: process.env.HOST,
        port: process.env.PORT,
        historyApiFallback: true,
    };
```

> Note: If you experience issues with specifying it here, you can also specify it in the `npm start` script by adding `--history-api-fallback`. I've experienced more luck with that in some situations, and documentation around the web differs.

> React Router is just one way to do all of this, too - if you're interested in coupling your Router to your state, **[react-router-redux](https://github.com/rackt/react-router-redux)** may be of instance to you. 

## Looking Ahead
In our next and final session, we'll be looking at integrating non-React components into React applications, as well as a review of best practices with regards to React development. We'll also extend our GitHub viewer one last time, to bring it all together. If you have any questions, reach out to me! Always happy to go over anything covered here.

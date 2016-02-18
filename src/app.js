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

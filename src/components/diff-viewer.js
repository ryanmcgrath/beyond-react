import React from 'react';
import hljs from 'highlight.js';
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
        let sha = this.props.params.sha;
        return (
            <div className="diff-container">
                <h1>Commit {sha} on {this.props.params.username}/{this.props.params.repository}</h1>
                {this.state.diff.files.map(function(file, i) {
                    return <FileView sha={sha} file={file} key={i} />;
                })}
            </div>
        );
    }
}


export default DiffView;

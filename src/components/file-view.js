import React from 'react';
import hljs from 'highlight.js';


class FileView extends React.Component {
    componentDidMount() {
        hljs.highlightBlock(this.refs.source);
    }

    componentWillUnmount() {

    }

    render() {
        return (<div className="file-view">
            <pre ref="source">{this.props.file.patch}</pre>
            <div className="file-name">{this.props.file.filename}</div>
        </div>);
    }
};

export default FileView;

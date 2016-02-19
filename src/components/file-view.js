import React from 'react';


class FileView extends React.Component {
    constructor(props) {
        super(props);
        this.updateCode = this.updateCode.bind(this);
    }
    
    componentDidMount() {
        window.highlighter.highlight(
            this.props.sha,
            this.props.file.patch,
            this.updateCode
        );
    }

    componentWillUnmount() {}

    updateCode(source) {
        this.refs.source.innerHTML = source;
    }

    render() {
        return (<div className="file-view">
            <pre ref="source">{this.props.file.patch}</pre>
            <div className="file-name">{this.props.file.filename}</div>
        </div>);
    }
};

export default FileView;

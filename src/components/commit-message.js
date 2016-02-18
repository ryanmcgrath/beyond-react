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

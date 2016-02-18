import React from 'react';
import {Link} from 'react-router';


class RepositoryLink extends React.Component {
    render() {
        let url = '/' + this.props.repo.owner.login + '/' + this.props.repo.name;
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

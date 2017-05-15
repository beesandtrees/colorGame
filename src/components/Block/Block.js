import React, { Component } from 'react';

import './Block.css';

export default class Block extends Component {
    constructor(props) {
        super(props);      
        this.state = {
            classes: "block block-" + this.props.cols + " " + this.props.backgroundColor,
            xcoord: this.props.xcoord,
            ycoord: this.props.ycoord
        }
    }
    render() {
        return (
            <div className={this.state.classes} onClick={(x,y)=>this.props.clickbox(this.props.xcoord, this.props.ycoord)}></div>
        )
    }
}
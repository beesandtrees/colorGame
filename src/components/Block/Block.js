import React, { Component } from 'react';

import './Block.css';

export default class Block extends Component {
    render() {
        return (
            <div 
            	className={"block block-" + this.props.cols + " " + this.props.active} 
            	style={{
	            	backgroundColor: this.props.color["background-color"], 
	            	borderColor: this.props.color["border-color"]
	            }}
            	onClick={(x,y)=>this.props.clickbox(this.props.xcoord, this.props.ycoord)}>
            </div>
        )
    }
}

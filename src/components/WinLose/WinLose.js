import React, { Component } from 'react';
import { winText } from '../Logic/helpers.js';
import { rand } from '../Logic/grid.js';

import './WinLose.css';

export default class WinLose extends Component {
    render() {
    	const winner = this.props.won;
    	const winLen = winText.length;

    	if(winner === true) {
	        return (
	            <div className="winlose win">
	            	<p>{winText[rand(winLen)]}</p>
	            	<span onClick={this.props.restart} className="btn">Next Level</span>
	            </div>
	        )
    	} else if ( winner === false) {
	        return (
	            <div className="winlose lose">
	            	<p>Maybe Next Time!</p>
	            	<span onClick={this.props.restart} className="btn">Restart</span>
	            </div>
	        )    		
    	}

        return (
            <div className="hidden"></div>
        )    	
    }
}

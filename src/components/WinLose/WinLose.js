import React, { Component } from 'react';
import { winText } from '../Logic/helpers.js';
import { rand } from '../Logic/grid.js';

import './WinLose.css';

export default class WinLose extends Component {
    render() {
    	let winner = this.props.won;
    	let winLen = winText.length;
    	let classes = "", resultsText;

    	if(winner === true) {
	        resultsText = (
	            <div>
	            	<p>{winText[rand(winLen)]}</p>
	            	<span onClick={this.props.restart} className="btn">Next Level</span>
	            </div>
	        )
    	} else if ( winner === false) {
	        resultsText = (
	            <div>
	            	<p>Maybe Next Time!</p>
	            	<span onClick={()=>this.props.restart(true)} className="btn">Restart</span>
	            </div>
	        )    		
    	} else {
    		classes = "hidden";
    	}

        return (
            <div className={"winlose " + classes}>
            	{resultsText}
            </div>
        )    	
    }
}

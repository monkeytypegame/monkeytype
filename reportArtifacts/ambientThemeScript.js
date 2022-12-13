// Scott & Will, with vector graphics help by JC.
//<!--This script generates the background lines and adds animation elements to them-->
//<!--Random values for starting curve-->
var bendX = (Math.random() * (window.innerWidth - 100) + 50);
var bendY = (Math.random() * (window.innerHeight - 100) + 50);
var startY = (Math.random() * (window.innerHeight - 100) + 50);
var endY = (Math.random() * (window.innerHeight - 100) + 50);
//<!--Random values for first animated curve-->
var animX = (Math.random() * (window.innerWidth - 100) + 50);
var animY = (Math.random() * (window.innerWidth - 100) + 50);
var animStartY = (Math.random() * (window.innerHeight - 100) + 50);
var animEndY = (Math.random() * (window.innerHeight - 100) + 50);
//<!--Random values for second animated curve-->
var animX2 = (Math.random() * (window.innerWidth - 100) + 50);
var animY2 = (Math.random() * (window.innerWidth - 100) + 50);
var animStartY2 = (Math.random() * (window.innerHeight - 100) + 50);
var animEndY2 = (Math.random() * (window.innerHeight - 100) + 50);
//<!--Animation values-->
var keySpline = "0.4 0 0.6 1";	//<!--Animation ease-in function for each stop-->
var keySpeed = "90s";	//<!--Time to execute full loop-->
var lineDensity = 15;	//<!--Relative density of lines / how many pixels between each line-->
for (let i = 0; i < window.innerHeight/2; i+=lineDensity){
	strokeWidth = (6-(i/90));
	if (strokeWidth > 0){ 
		//--Stops us from drawing lines with negative or zero width on large or oddly-shaped screens-->
		//<!--generate SVG path element above (-) and below (+) the starting line (draws two starting lines on first loop)-->
		document.getElementById("snakes").innerHTML += '<path id="snake+'+i+'" d="m -1 ' + (startY+i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY+i)-startY) + '" stroke="#ededed" stroke-width="' + strokeWidth + '" fill="none"/>';
		document.getElementById("snakes").innerHTML += '<path id="snake-'+i+'" d="m -1 ' + (startY-i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY-i)-startY) + '" stroke="#ededed" stroke-width="' + strokeWidth + '" fill="none"/>';
		//<!--Generate values for both animated curves for first (lower) curve-->
		animString = 'm -1 '+(animStartY+i)+' q ' + animX + ' ' +(animStartY-animY) + ' ' + window.innerWidth +' ' + ((animEndY+i)-animStartY);
		animString2 = 'm -1 '+(animStartY2+i)+' q ' + animX2 + ' ' +(animStartY2-animY2) + ' ' + window.innerWidth +' ' + ((animEndY2+i)-animStartY2);
		//<!--Generate SVG animate element inside of the + snake we just made-->
		document.getElementById("snake+"+i).innerHTML += '<animate attributeName="d" to="m -1 ' + (startY+i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY+i)-startY) + '" dur="'+keySpeed+'" repeatCount="indefinite" values="m 0 ' + (startY+i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY+i)-startY) + ';'+animString+';'+animString2+';m 0 ' + (startY+i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY+i)-startY) + '" keyTimes="0;.33;.66;1" calcMode="spline" keySplines="'+keySpline+';'+keySpline+';'+keySpline+';" fill="freeze"/>';
		//<!--Generate values for both animated curves for second (higher) curve-->
		animString = 'm -1 '+(animStartY-i)+' q ' + animX + ' ' +(animStartY-animY) + ' ' + window.innerWidth +' ' + ((animEndY-i)-animStartY);
		animString2 = 'm -1 '+(animStartY2-i)+' q ' + animX2 + ' ' +(animStartY2-animY2) + ' ' + window.innerWidth +' ' + ((animEndY2-i)-animStartY2);
		//<!--Generate SVG animate element inside of the - snake we just made-->
		document.getElementById("snake-"+i).innerHTML += '<animate attributeName="d" to="m -1 ' + (startY-i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY-i)-startY) + '" dur="'+keySpeed+'" repeatCount="indefinite" values="m 0 ' + (startY-i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY-i)-startY) + ';'+animString+';'+animString2+';m 0 ' + (startY-i) + ' q '+ bendX + ' ' + (startY-bendY) + ' ' + window.innerWidth + ' ' + ((endY-i)-startY) + '" keyTimes="0;.33;.66;1" calcMode="spline" keySplines="'+keySpline+';'+keySpline+';'+keySpline+';" fill="freeze"/>';
	}
}

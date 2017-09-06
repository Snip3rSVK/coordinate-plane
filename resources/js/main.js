/* global Draggable, TweenLite, TweenMax, Power0, Power2, Power3, Power4, TimelineLite, TimelineMax */
/* Nadizajnovať na papier! */

/*
vyladit scrollovanie - ok
urobit clickAndScroll tak aby scrollo stranku len vtedy ak sa myška pohne viac ako 3 pixely napr. - ok
ked su menej ako dva body nech sa nedá klknúť na spojiť body - ok
ked napr. mám zapnuté pridať body a uživ. klikne na spojit body nech automaticky vypne napr pridat body - ok
namiesto červené písma urobiť animáciu (v ovládaciom paneli) - ok
ak sa zmení veľkosť okna, tak odznova zvolať setupAxis - ok
urobit vlastne kurzory - napr. pri pridavani bodov plusko a pod.
vylepšiť, okomentovať kód, zlepšiť výkon
urobit súradnicový systém
pridat pomenovania bodov, čiar a pod.
urobit pole na vyhladávanie - napr ked tam uživ. napíše [0,0] tak mu nájde bod [0, 0], ked tam napíše A tak mu najde bod A
    možno aj napr +[0, 0] - pridá bod na [0, 0] (alebo napr. pridaj [0, 0] / odstráň [0, 0] ), napr. uhol ABC -> 50°, dĺžka |AB| -> 6cm a pod.

známe bugy -----------------
1.) pri spájaní bodov ak chcem urobiť prvý spoj tak na prvý bod čo kliknem musím kliknúť 2 krát - vyriešené
2.) ked pridávam alebo spáajam body nemôžem posunúť dokument - vyriešené
 */
//(function() {
// ======== DECLARATIONS ========
"use strict";
const element = {
	addPoints: document.querySelector("#add-points"),
	body: document.querySelector("body"),
	controlPanel: document.querySelector("#control-panel"),
	controlPanelContent: document.querySelector("#control-panel-content"),
	close: document.querySelector("#close"),
	heading: document.querySelector(".heading"),
	removeGeometryObjects: document.querySelector("#remove-geometry-objects"),
	settings: document.querySelector("#settings"),
	settingsIcon: document.querySelector(".settings-icon"),
	settingsIconWrapper: document.querySelector(".settings-icon-wrapper"),
	joinPoints: document.querySelector("#join-points"),
	svg: document.querySelector("#svg-wrapper svg"),
	svgWrapper: document.querySelector("#svg-wrapper")
};

const controlPanel = {
	list: {},
	usedTools: {
		list: [],
		check(name) {
			return (this.list.indexOf(name) > -1) ? true : false;
		}, // this refers to controlPanel.usedTools here
		add(name) {
			return (!this.check(name)) ? this.list.push(name) : false;
		},
		remove(name) {
			return (this.check(name)) ? this.list.splice(this.list.indexOf(name), 1) : false;
		}
	},
	addTool(name, tool) {
		this.list[name] = tool;
	},
	cancelToolsExcept(name) {
		for (let i = 0; i < this.usedTools.list.length; i++) {
			const currToolName = this.usedTools.list[i];
			if (currToolName !== name) {
				identifiers[currToolName].reverse();
				this.list[currToolName].toolFunc("cancel");
			}
		}
	}
};

let snapBy = 10;
let identifiers = {};
const roundToSnap = (num) => Math.round(num / (4 * snapBy)) * 4 * snapBy;

const svgSettings = {
    width: roundToSnap(element.body.clientWidth * 3),
    height: roundToSnap(element.body.clientHeight * 3)
};

const over = (elem) => scale(elem, 2, .14, Power0.easeNone, "center center");
const out = (elem) => scale(elem, 1, .14, Power0.easeNone, "center center");
const delta = (numA, numB) => Math.abs(numA - numB);
const controlPanelTl = new TimelineLite();

Point.instances = [];
Line.instances = [];

function setAttributesNS(namespace, elem, attrs) {
    for (let prop in attrs)
        elem.setAttributeNS(namespace, prop, attrs[prop]);
}
// ======== INITIAL SETUPS ========
setupSVG();
scrollToCenter();
setupAxis();
clickAndScroll();

function setupSVG() {
    element.svg.setAttribute("style", `width: ${roundToSnap(element.body.clientWidth * 3)}px; height: ${roundToSnap(element.body.clientHeight * 3)}px`);
}

function scrollToCenter() {
	element.svgWrapper.scrollLeft = (element.svgWrapper.scrollWidth - element.body.clientWidth) / 2;
	element.svgWrapper.scrollTop = (element.svgWrapper.scrollHeight - element.body.clientHeight) / 2;
}

function setupAxis() {
	const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    setAttributesNS(null, xAxis, { x1: "0", y1: "50%", x2: "100%", y2: "50%" });
	xAxis.classList.add("xAxis");
	element.svg.appendChild(xAxis);

	const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    setAttributesNS(null, yAxis, { x1: "50%", y1: "0", x2: "50%", y2: "100%" });
	yAxis.classList.add("yAxis");
	element.svg.appendChild(yAxis);

	const numberWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
	numberWrapper.classList.add("numberWrapper");
	element.svg.appendChild(numberWrapper);

    let i = 2 * snapBy, j = 1;
    while (i < svgSettings.height / 2 || i < svgSettings.width / 2) {
        if (i < svgSettings.height / 2) {
            const numToSubstract = () => j < 10 ? 10 : 15;
            const textNegative = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const textPositive = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textNegative.textContent = `−${j}`;
            textPositive.textContent = j;
            const negGbcr = textNegative.getBoundingClientRect().height;
            const posGbcr = textPositive.getBoundingClientRect().height;
            setAttributesNS(null, textNegative, { x: svgSettings.width / 2 - numToSubstract() - 5, y: svgSettings.height / 2 + i + 3});
            setAttributesNS(null, textPositive, { x: svgSettings.width / 2 - numToSubstract(), y: svgSettings.height / 2 - i + 3});
            numberWrapper.appendChild(textNegative);
            numberWrapper.appendChild(textPositive);
        }
        if (i < svgSettings.width / 2) {
            const textNegative = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const textPositive = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textNegative.textContent = `−${j}`;
            textPositive.textContent = j;
            numberWrapper.appendChild(textNegative);
            numberWrapper.appendChild(textPositive);
            const negGbcr = textNegative.getBoundingClientRect().width;
            const posGbcr = textPositive.getBoundingClientRect().width;
            setAttributesNS(null, textNegative, { x: svgSettings.width / 2 - i - negGbcr / 2, y: svgSettings.height / 2 + 12 });
            setAttributesNS(null, textPositive, { x: svgSettings.width / 2 + i - posGbcr / 2, y: svgSettings.height / 2 + 12 });
        }
        i += 2 * snapBy;
        j++;
    }
}

function removeAxis() {
	document.querySelector(".xAxis").remove();
	document.querySelector(".yAxis").remove();
	document.querySelector(".numberWrapper").remove();
}

function clickAndScroll() {
	if (arguments[0] === "cancel" && Draggable.get(element.svgWrapper) !== undefined) {
		console.log("clickAndScroll disabled");
		Draggable.get(element.svgWrapper).disable();
	} else if (Draggable.get(element.svgWrapper) === undefined) {
		console.log("clickAndScroll created");
		Draggable.create(element.svgWrapper, {
			type: "scroll",
			cursor: "default",
			onPress: function () {
				element.svgWrapper.style.cursor = "move";
				if (!controlPanel.usedTools.check("joinPoints")) {
					pointsDraggable("cancel");
				}
			},
			onDrag: function () {
				element.svgWrapper.style.cursor = "move";
			},
			onRelease: function () {
				if (!controlPanel.usedTools.check("joinPoints")) {
					pointsDraggable();
				}
			},
			edgeResistance: 1,
			minimumMovement: 5
		});
		TweenMax.set(element.svgWrapper, {
			overflow: "hidden",
		});
	} else if (Draggable.get(element.svgWrapper).enabled() === false) { // if false
		console.log("clickAndScroll enabled");
		Draggable.get(element.svgWrapper).enable();
	}
}

window.addEventListener("resize", function () {
	removeAxis();
	setupAxis();
	scrollToCenter();
});

// ======== GEOMETRY OBJECTS ========
function GeometryObject() {
	this.elem,
		this.style = "",
		this.setElem = (value) => this.elem = value,
		this.setStyle = (value) => this.style = value;
}

Point.prototype = new GeometryObject();
Line.prototype = new GeometryObject();

function Point(cx, cy, r) {
	this.connectedLines = [],
		this.cx = cx,
		this.cy = cy,
		this.r = r || 4,
		this.append = () => appendFromObjProps(this, "circle", "point");
	this.addConnectedLine = (line, lineCommand) => this.connectedLines.push({
		line: line,
		lineCommand: lineCommand
	});
	GeometryObject.call(this);
	Point.instances.push(this);
}

function Line(d) {
	this.d = d,
		this.append = () => appendFromObjProps(this, "path", "line"),
		this.setD = (value) => this.d = value,
		GeometryObject.call(this);
	Line.instances.push(this);
}

function appendFromObjProps(obj, elem, classToAdd) {
	const properties = Object.keys(obj);
	const elemNS = document.createElementNS("http://www.w3.org/2000/svg", elem);
	if (classToAdd !== undefined)
		elemNS.classList.add(classToAdd);
	for (let i = 0; i < properties.length; i++) {
		if (typeof obj[properties[i]] !== "function" && typeof obj[properties[i]] !== "undefined" && typeof obj[properties[i]] !== "object")
			elemNS.setAttributeNS(null, properties[i], obj[properties[i]]);
	}
	if (Point.instances.length === 0) {
		element.svg.appendChild(elemNS);
	} else {
		/* inserts element before first circle element - this is particularly for inserting paths - if paths were inserted after
		 circles then ends of paths (lines) will be "on" points if cursor enters these ends mouseleave will fire and this is
		 unwanted. Svg works on principle "first element -> 'painted' first" (version SVG 1.1). In version SVG 2 (maybe SVG 2.1)
		 works on z-index - but almost none browser supports this (or maybe supports, but z-index requires to set elements
		 position to other than static), so that's why I came up with this solution. For testing this, change color of path (lines)
		 to other color than color of circles (points) */
		element.svg.insertBefore(elemNS, document.querySelector(".point"));
	}
	obj.setElem(elemNS);
}

function toggleEvent(elem, event, function1, function2) { // apply only once for element!
	let eventDone = false;
	elem.addEventListener(event, () => {
		if (!eventDone) {
			function1();
			eventDone = true;
		} else {
			function2();
			eventDone = false;
		}
	});
}

function scale(elem, scale, duration, ease, transformOrigin) {
	return function () {
		TweenLite.to(elem, duration, {
			scale: scale,
			ease: ease,
			transformOrigin: transformOrigin
		});
	};
}

function snap(draggableObject, elem, snapX, snapY) {
	return function () {
		TweenLite.to(elem, 0, {
			x: Math.round(draggableObject.x / snapX) * snapX,
			y: Math.round(draggableObject.y / snapY) * snapY
		});
	};
}

function addPoints() {
	if (arguments[0] === "cancel") {
		delete Draggable.get(element.svgWrapper)._listeners.click; // removes click event listener below ↓ ↓ ↓
		delete Draggable.get(element.svgWrapper)._listeners.press; // removes press event listener below ↓ ↓ ↓
		controlPanel.usedTools.remove("addPoints");
		pointsDraggable();
		return false;
	}

	controlPanel.cancelToolsExcept("addPoints");
	controlPanel.usedTools.add("addPoints");
	Draggable.get(element.svgWrapper).addEventListener("click", function () {
		new Point(Math.round((element.svgWrapper.scrollLeft + Draggable.get(element.svgWrapper).pointerX) / snapBy) * snapBy, Math.round((element.svgWrapper.scrollTop + Draggable.get(element.svgWrapper).pointerY) / snapBy) * snapBy).append();
		pointsDraggable();
		if (Point.instances.length === 1) {
			element.removeGeometryObjects.style.display = "initial";
		}
		toggleTool(element.joinPoints, function () {
			return Point.instances.length >= 2;
		});
	});

	Draggable.get(element.svgWrapper).addEventListener("press", function () {
		element.svgWrapper.style.cursor = "default";
	});
}

function joinPoints() {
	if (arguments[0] === "cancel") {
		for (let i = 0; i < Point.instances.length; i++) {
			const curr = Point.instances[i].elem;
			curr.onclick = null;
			curr.onmouseenter = over(curr);
		}
		controlPanel.usedTools.remove("joinPoints");
		pointsDraggable();
		clearLines();
		return false;
	}

	controlPanel.cancelToolsExcept("joinPoints");
	controlPanel.usedTools.add("joinPoints");
	pointsDraggable("cancel");
	let line;
	let beginNewLine = true;
	let lastClicked;

	for (let i = 0; i < Point.instances.length; i++) {
		const curr = Point.instances[i].elem;
		curr.onmouseenter = function () {
			over(curr)();
			curr.style.cursor = "pointer";
		};
		curr.onclick = function () {
			/* to handle strange behavior of clickAndScroll press, try comment this and click to Join Points, click to point
			 and move cursor out of point - cursor type is "move" and it should be "default" */
			element.svgWrapper.style.cursor = "default";
			if (beginNewLine) {
				line = new Line("");
				beginNewLine = false;
				lastClicked = curr;
				line.setD(`M ${Point.instances[i].cx} ${Point.instances[i].cy}`);
				Point.instances[i].addConnectedLine(line, "M");
			} else if (lastClicked != curr) {
				beginNewLine = true;
				lastClicked = undefined;
				line.setD((`${line.d} L ${Point.instances[i].cx} ${Point.instances[i].cy}`).trim());
				line.append();
				Point.instances[i].addConnectedLine(line, "L");
			}
		};
	}
}

function pointsDraggable() {
	for (let i = 0; i < Point.instances.length; i++) {
		const curr = Point.instances[i].elem;
		if (arguments[0] === "cancel") {
			if (Draggable.get(curr) !== undefined) {
				Draggable.get(curr).disable();
				console.log("pointsDraggable disabled");
			}
		} else if (Draggable.get(curr) === undefined || arguments[0] === "create") {
			console.log("pointsDraggable created");
			if (arguments[0] === "create") {
				Draggable.get(curr).kill();
			}

			curr.onmouseenter = over(curr);
			curr.onmouseleave = out(curr);

			Draggable.create(curr, {
				bounds: element.svg,
				onDrag: function () {
					curr.onmouseleave = null; // cancels onmouseleave
					element.body.style.cursor = "move";
					over(curr)();
					snap(this, curr, snapBy, snapBy)();
					Point.instances[i].cx = Math.round(curr.getBoundingClientRect().left + element.svgWrapper.scrollLeft + curr.getBoundingClientRect().width / 2) / snapBy * snapBy; // nevymazovať round pretože ak by cx al. cy bolo desatinné číslo, tak regex vo funkcii updateLines by zle matchlo číslo (napr 19.99954) by matchlo ako ["19", "99954"];
					Point.instances[i].cy = Math.round(curr.getBoundingClientRect().top + element.svgWrapper.scrollTop + curr.getBoundingClientRect().height / 2) / snapBy * snapBy;
					updateLines(i);
				},
				onPress: function () {
					over(curr)();
					clickAndScroll("cancel");
				},
				onDragEnd: function () {
					element.body.style.cursor = "default";
					curr.onmouseleave = function () {
						out(curr)();
					};
					out(curr)();
					if (this.hitTest("#remove-geometry-objects", "50%") || this.hitTest("#remove-geometry-objects img", "0.1%")) {
						removePoints(i);
						clickAndScroll();
					}
				},
				onRelease: function () {
					clickAndScroll();
				}
			});
		} else if (Draggable.get(curr).enabled() === false) {
			Draggable.get(curr).enable();
			console.log("pointsDraggable enabled");
		}
	}
}

function updateLines(index) {
	for (let i = 0; i < Point.instances[index].connectedLines.length; i++) {
		const currLine = Point.instances[index].connectedLines[i].line;
		const lineCommand = Point.instances[index].connectedLines[i].lineCommand;
		const regex = new RegExp(`${lineCommand} \\d+ \\d+`, "gi");
		currLine.setD(currLine.d.replace(regex, `${lineCommand} ${Point.instances[index].cx} ${Point.instances[index].cy}`));
		currLine.elem.setAttributeNS(null, "d", currLine.d);
	}
}

function clearLines() {
	for (let i = 0; i < Point.instances.length; i++) {
		for (let j = 0; j < Point.instances[i].connectedLines.length; j++) {
			const currLine = Point.instances[i].connectedLines[j].line;
			if (currLine.elem === undefined) {
				Point.instances[i].connectedLines.splice(j, 1);
				j--;
			}
		}
	}
}

function removePoints(index) {
	for (let i = 0; i < Point.instances[index].connectedLines.length; i++) {
		Point.instances[index].connectedLines[i].line.elem.remove();
	}
	Point.instances[index].elem.remove();
	Point.instances.splice(index, 1);
	if (Point.instances.length === 0) {
		element.removeGeometryObjects.style.display = "none";
	}
	pointsDraggable("create");
	toggleTool(element.joinPoints, function () {
		return Point.instances.length >= 2;
	});
}

controlPanelTl.add("icons")
	.to(element.settings, .23, {
		ease: Power3.easeOut,
		scale: 0,
		transformOrigin: "center center"
	}, "icons")
	.to(element.close, .17, {
		ease: Power3.easeOut,
		scale: 0.4444,
		transformOrigin: "center center",
		fill: "#11accd"
	}, "icons")
	.to(element.settingsIconWrapper, .17, {
		ease: Power3.easeOut,
		backgroundColor: "#fff"
	}, "icons")
	.add("widthHeight", "-=0.1")
	.to(element.controlPanel, .2, {
		ease: Power3.easeOut,
		width: "307px"
	}, "widthHeight")
	.to(element.controlPanel, .2, {
		ease: Power4.easeOut,
		height: "100%"
	}, "widthHeight")
	.to(element.heading, .2, {
		ease: Power3.easeOut,
		opacity: "1",
		width: "auto"
	}, "widthHeight+=0.05")
	.to(element.controlPanelContent, .1, {
		ease: Power3.easeOut,
		display: "block",
		opacity: "1"
	}, "widthHeight+=0.1");
controlPanelTl.pause();
//tl.timeScale(0.2);

toggleEvent(element.settingsIconWrapper, "click", function () {
	controlPanelTl.play();
}, function () {
	controlPanelTl.reverse();
});

function Tool(toolFunc) {
	this.toolFunc = toolFunc;
}

controlPanel.addTool("addPoints", new Tool(addPoints));
controlPanel.addTool("joinPoints", new Tool(joinPoints));

function toolAnim(elem, identifier) {
	if (identifiers[identifier] === undefined) {
		let tl = new TimelineMax({
			paused: true
		});
		tl.add("begin")
			.to(elem, 0.2, {
				backgroundColor: "#D5F903",
				ease: Power3.easeIn
			}, "begin")
			.to(elem, 0.15, {
				paddingLeft: "15px"
			}, "begin=+0.1");
		identifiers[identifier] = tl;
		return tl;
	} else {
		return identifiers[identifier];
	}
}

function toggleTool(elem, condFunc) {
	if (condFunc()) {
		elem.classList.remove("disabled");
	} else {
		elem.classList.add("disabled");
	}
}

function toggleToolClick(elem, tool, toolFunc, condFunc = () => true) { // cond - condition
	elem.addEventListener("click", function () {
		if (condFunc()) {
			if (controlPanel.usedTools.check(tool)) {
				toolAnim(elem, tool).reverse();
				toolFunc("cancel");
			} else {
				toolAnim(elem, tool).play();
				toolFunc();
			}
		}
	});
}

toggleToolClick(element.addPoints, "addPoints", addPoints);
toggleToolClick(element.joinPoints, "joinPoints", joinPoints, function () {
	return Point.instances.length >= 2;
});
toggleTool(element.joinPoints, function () {
	return Point.instances.length >= 2;
});
//})();
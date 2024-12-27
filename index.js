
const createSVGWindow = async () => { const { createSVGWindow } = await import('svgdom') }
const registerWindow = async () => { const { registerWindow } = await import('@svgdotjs/svg.js') }
import {SVG} from '@svgdotjs/svg.js'
import { jsdom } from 'jsdom-jscore-rn'
import * as fs from 'fs';


const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);



function loadSVG(svgFilePath) {
    const dom = new jsdom(`<!DOCTYPE html><body>${fs.readFileSync(svgFilePath, 'utf-8')}</body>`);
    const svgElement = dom.window.document.querySelector('svg');
    if (!svgElement) {
        throw new Error('SVG element not found.');
    }
    const svg = new SVG(svgElement);

    let path = svg.find('path')[0]
    if (!path) {
        throw new Error('Path not found in svg');
    }

    const pathString = path.getAttribute('d')
    const points = parseSVGPath(pathString)
    return points;
}

function parseSVGPath(pathString) {
    const segments = pathString.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g);
    const points = [];
    let currentX = 0;
    let currentY = 0;

    if (segments) {
        for (const segment of segments) {
            const command = segment[0];
            const values = segment.slice(1).trim().split(/[\s,]+/).map(Number);

            switch (command) {
                case 'M':
                case 'm':
                    currentX = values[0];
                    currentY = values[1];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'L':
                case 'l':
                    currentX = values[0];
                    currentY = values[1];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'H':
                case 'h':
                    currentX = values[0]
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'V':
                case 'v':
                    currentY = values[0];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'Z':
                case 'z':
                    //Close path so it ends where it began
                    points.push(points[0])
                    break;
                // Handle curve commands if needed
                case 'C':
                case 'c':
                    //Handle curves if needed
                    break;
                case 'S':
                case 's':
                    //Handle curves if needed
                    break;
                case 'Q':
                case 'q':
                    //Handle curves if needed
                    break;
                case 'T':
                case 't':
                    //Handle curves if needed
                    break;
                case 'A':
                case 'a':
                    //Handle curves if needed
                    break;
            }
        }
    }

    return points
}

function createParallelLines(boundaryPoints, radius, spacingMultiplier = 2) {
    const parallelLines = [];
    if (!boundaryPoints || boundaryPoints.length <= 1) {
        return parallelLines;
    }


    const numPoints = boundaryPoints.length;
    for (let i = 0; i < numPoints - 1 ; i++) {
        const p1 = boundaryPoints[i];
        const p2 = boundaryPoints[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if(length === 0 )
            continue;


        const normalX = -dy / length;
        const normalY = dx / length;

        let offset = radius;
        let linePair = []


        while(offset < length) {

            const startX1 = p1.x + normalX * offset;
            const startY1 = p1.y + normalY * offset;

            const endX1 = p2.x + normalX * offset
            const endY1 = p2.y + normalY * offset;

            linePair.push({p1: {x: startX1, y: startY1}, p2: {x: endX1, y:endY1}})

            offset += radius * spacingMultiplier;

        }

        parallelLines.push(...linePair);

    }


    return parallelLines;
}


function traceCable(parallelLines) {
    const cableSegments = [];
    if (!parallelLines || parallelLines.length === 0) {
        return cableSegments;
    }

    let flip = false;
    for (let i = 0; i < parallelLines.length-1; i++){
        const line1 = parallelLines[i];
        const line2 = parallelLines[i+1]
        if(flip) {
            cableSegments.push({p1:line1.p2, p2: line2.p1});
        } else {
            cableSegments.push({p1:line1.p1, p2: line2.p2});
        }
        flip = !flip
    }


    return cableSegments;
}

function calculateCableLength(cableSegments) {
    let totalLength = 0;

    if (!cableSegments || cableSegments.length === 0) {
        return totalLength;
    }

    for(const segment of cableSegments) {
        const dx = segment.p2.x - segment.p1.x;
        const dy = segment.p2.y - segment.p1.y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
    }


    return totalLength;
}

function calculateHeatedFloor(svgFilePath, radii) {
    try {
        const boundaryPoints = loadSVG(svgFilePath);

        console.log(boundaryPoints)
        const results = {};

        for (const radius of radii) {
            const parallelLines = createParallelLines(boundaryPoints, radius);
            const cablePath = traceCable(parallelLines);
            const cableLength = calculateCableLength(cablePath);

            results[radius] = cableLength;
        }
        return results;
    } catch (e) {
        console.error(e);
        return null;
    }
}


// Пример использования
const svgFilePath = 'F:\\practic\\svg\\index.svg'; // Замените на путь к вашему SVG файлу.
const radii = [2, 4]; // Замените на нужные радиусы в условных единицах.
const calculatedLength = calculateHeatedFloor(svgFilePath, radii);


if(calculatedLength)
    console.log("Calculated Lengths",calculatedLength);
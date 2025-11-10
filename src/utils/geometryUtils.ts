import { Point } from "@/models/Point";
import { Polygon } from "@/models/Polygon";
import { Delaunay, Voronoi } from 'd3-delaunay';

const MAP_SIZE = {
  'smallTown': 6,
  'largeTown': 10,
  'smallCity': 15,
  'largeCity': 24,
  'metropolis': 40,
}

type MapSize = keyof typeof MAP_SIZE;

export const generateMapRegions = (mapSize: MapSize) => {
  const numberOfRegions = MAP_SIZE[mapSize];
  const numberOfCells = numberOfRegions * 8;

  return generateGeometry(numberOfCells);
}

export const generateGeometry = (numberOfCells: number) => {
  const points = generatePoints(numberOfCells);
  const bounds = getBoundsFromPoints(points);
  const voronoi = generateVoronoi(points, bounds);
  const relaxedVoronoi = relaxCentralCells(voronoi, numberOfCells / 8);

  return convertVoronoiToPolygons(relaxedVoronoi);
};

const generatePoints = (numberOfCells: number) => {
  const sa = Math.random() * 2 * Math.PI;
  const points: Point[] = [];
  for (let i = 0; i < numberOfCells; i++) {
    const a = sa + Math.sqrt(i) * 5;
    const r = (i === 0 ? 0 : 10 + i * (2 + Math.random()));
    points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return points;
}

const getBoundsFromPoints = (points: Point[]): Delaunay.Bounds => {
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));

  var dx = (maxX - minX) * 0.5;
  var dy = (maxY - minY) * 0.5;

  return [minX - dx / 2, minY - dy / 2, maxX + dx / 2, maxY + dy / 2];
};


const generateVoronoi = (points: Point[], bounds: Delaunay.Bounds) => {
  const delaunayPoints = points.map(p => [p.x, p.y] as [number, number]);
  const delaunay = Delaunay.from(delaunayPoints);
  const voronoi = delaunay.voronoi(bounds);
  return voronoi;
}

const relaxCentralCells = (
  voronoi: Voronoi<Delaunay.Point>,
  numberOfRegions: number,
): Voronoi<Delaunay.Point> => {


  let currentVoronoi = voronoi;
  let relaxedPoints = getArrayOfPoints(voronoi);

  // Relax 3 times
  for (let i = 0; i < 3; i++) {
    // Points to relax: first 3 and the one at numberOfRegions
    const toRelaxIndices = [0, 1, 2, numberOfRegions];


    toRelaxIndices.forEach((toRelaxIndex) => {
      const cellPolygon = currentVoronoi.cellPolygon(toRelaxIndex);
      if (cellPolygon && cellPolygon.length > 0) {
        const center = findCenter(cellPolygon);
        relaxedPoints[toRelaxIndex] = center;
      }
    });

    // Regenerate Voronoi with relaxed points
    currentVoronoi.delaunay.points = relaxedPoints.reduce((acc, p) => [...acc, p[0], p[1]], [] as number[]);
    currentVoronoi.delaunay.update();
    currentVoronoi.update();
    relaxedPoints = getArrayOfPoints(currentVoronoi);
  }


  return currentVoronoi;
};

const convertVoronoiToPolygons = (voronoi: Voronoi<Delaunay.Point>) =>
  Array.from(voronoi.cellPolygons(), cell => ({
    vertices: Array.from(cell, ([x, y]) => ({ x, y }))
  }));


const findCenter = (polygon: Delaunay.Polygon): Delaunay.Point => {
  const sumX = polygon.reduce((acc, [x]) => acc + x, 0);
  const sumY = polygon.reduce((acc, [, y]) => acc + y, 0);
  const len = polygon.length;
  return [sumX / len, sumY / len];
};

const getArrayOfPoints = (voronoi: Voronoi<Delaunay.Point>): Delaunay.Point[] => {
  const flat = voronoi.delaunay.points;
  return Array.from({ length: flat.length / 2 }, (_, i) => [flat[i * 2], flat[i * 2 + 1]] as Delaunay.Point);
};
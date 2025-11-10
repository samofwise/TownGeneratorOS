import { Polygon } from '@/models/Polygon';
import { generateGeometry, generateMapRegions } from '@/utils/geometryUtils';
import { useEffect, useState, useMemo } from 'react';

const App = () => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);

  useEffect(() => {
    const polygons = generateMapRegions('smallTown');
    setPolygons(polygons);
  }, []);

  // Calculate viewBox to fit all polygons
  const viewBox = useMemo(() => {
    if (polygons.length === 0) return '0 0 1000 1000';

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    polygons.forEach((polygon) => {
      polygon.vertices.forEach((vertex) => {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;

    return `${minX} ${minY} ${width} ${height}`;
  }, [polygons]);

  // Convert polygon vertices to SVG path string
  const polygonToPath = (polygon: Polygon): string => {
    if (polygon.vertices.length === 0) return '';
    const points = polygon.vertices.map((v) => `${v.x},${v.y}`).join(' ');
    return `M ${points} Z`;
  };

  return (
    <div className="w-screen h-screen bg-paper overflow-hidden">
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {polygons.map((polygon, index) => (
          <path
            key={index}
            d={polygonToPath(polygon)}
            fill="none"
            stroke="black"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};

export default App;

/** Chart colours. Hex values (not CSS variables) so exported PNGs keep their colour. */
export const SERIES = ["#7E9A6E", "#D98FA0", "#E3B84F", "#9C8FCB", "#6FA6BF", "#E59A6C", "#5E8A80", "#C77DB3"];
export const AXIS = "#8A817A";
export const GRID = "rgba(138,129,122,0.22)";
export const colorFor = (i: number) => SERIES[i % SERIES.length];

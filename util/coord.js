/**
 * Snap latitude to a square patch of target size
 * @param {number} lat - original latitude in degrees
 * @param {number} targetKm - target patch size in km
 * @returns {number} snapped latitude
 */
export function patchLat(lat, targetKm) {
  const degLatSize = targetKm / 111; // degrees per patch
  return Math.round(lat / degLatSize) * degLatSize;
}

/**
 * Snap longitude to a square patch of target size
 * @param {number} lon - original longitude in degrees
 * @param {number} lat - original latitude in degrees
 * @param {number} targetKm - target patch size in km
 * @returns {number} snapped longitude
 */
export function patchLon(lon, lat, targetKm) {
  const degLonSize = targetKm / (111 * Math.cos(lat * Math.PI / 180)); // degrees per patch
  return Math.round(lon / degLonSize) * degLonSize;
}

// Example usage:
const lon = 13.3999;
const lat = 42.3506;
const targetKm = 100;

const snappedLat = patchLat(lat, targetKm);
const snappedLon = patchLon(lon, lat, targetKm);

console.log("Original:", lon, lat);
console.log("Snapped to 100 km patch:", snappedLon, snappedLat);

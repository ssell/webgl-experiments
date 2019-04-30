/**
 * Returns a random float on the range [min, max].
 * 
 * @param {*} min 
 * @param {*} max 
 */
function GetRandom(min, max)
{
    return Math.random() * (max - min) + min;
}
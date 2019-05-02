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

function Clamp(x, min, max)
{
    return Math.min(Math.max(x, min), max);
}

function Lerp1(from, to, s)
{
    let fraction = Clamp(s, 0.0, 1.0);
    return (from * (1 - fraction)) + (to * fraction);
}

function Lerp2(from, to, s)
{
    return [Lerp1(from[0], to[0], s), Lerp1(from[1], to[1], s)];
}

function Lerp3(from, to, s)
{
    return [Lerp1(from[0], to[0], s), Lerp1(from[1], to[1], s), Lerp1(from[2], to[2], s)];
}
/**
 * Collection of various utility and helper methods.
 */
class Utils
{
    /**
     * Returns a random float on the range [min, max].
     * 
     * @param {*} min 
     * @param {*} max 
     */
    static getRandom(min, max)
    {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generates a random color [r, g, b, a]. Each component is a value [0.0, 1.0].
     * 
     * @param {*} randomAlpha If true, will also generate a random alpha value. Other returns with an alpha of 1.0.
     */
    static getRandomColor(randomAlpha = false)
    {
        return [Utils.getRandom(0, 1), Utils.getRandom(0, 1), Utils.getRandom(0, 1), (randomAlpha === true) ? Utils.getRandom(0, 1) : 1.0]
    }

    /**
     * Returns the specified value `x` clamped between the `min` and `max` values.
     * 
     * @param {*} x 
     * @param {*} min 
     * @param {*} max 
     */
    static clamp(x, min, max)
    {
        return Math.min(Math.max(x, min), max);
    }

    /**
     * Performs linear interpolation for a single value.
     * The return value is on the range [from, to].
     * 
     * @param {*} from The value returned when `s` is 0.0.
     * @param {*} to The value returned when `s` is 1.0.
     * @param {*} s The interpolation value, clamped to the range [0.0, 1.0].
     */
    static lerp1(from, to, s)
    {
        let fraction = Utils.clamp(s, 0.0, 1.0);
        return (from * (1 - fraction)) + (to * fraction);
    }

    /**
     * Returns an array of two linearly interpolated values.
     * 
     * @param {*} from 
     * @param {*} to 
     * @param {*} s 
     */
    static lerp2(from, to, s)
    {
        return [Utils.lerp1(from[0], to[0], s), Utils.lerp1(from[1], to[1], s)];
    }

    /**
     * Returns an array of three linearly interpolated values.
     * @param {*} from 
     * @param {*} to 
     * @param {*} s 
     */
    static lerp3(from, to, s)
    {
        return [Utils.lerp1(from[0], to[0], s), Utils.lerp1(from[1], to[1], s), Utils.lerp1(from[2], to[2], s)];
    }

    /**
     * Merges the value of `a` into `b`.
     * 
     * @param {*} a 
     * @param {*} b 
     */
    static mergeArrays(a, b)
    {
        let result = b.slice();

        for(let i = 0; (i < a.length) && (i < b.length); ++i)
        {
            result[i] = a[i];
        }

        return result;
    }

    /**
     * Returns a value for the provided (x, y) point.
     * See https://jsfiddle.net/ssell/5smy3qg6/
     * 
     * @param {*} x 
     * @param {*} y 
     */
    static cantorPair(x, y)
    {
        return ((x + y) * (x + y + 1)) / 2 + y;
    }
}

class Rectangle
{
    constructor(x = 0, y = 0, width = 0, height = 0)
    {
        this.x      = x;
        this.y      = y;
        this.width  = width;
        this.height = height;
    }
}
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

/**
 * Implementation of a list that does not decrease in size.
 */
class FixedList
{
    constructor()
    {
        this.contents = [];
        this.occupied = [];
        this.count    = 0;
    }

    /**
     * Adds the object to the list and returns it's index.
     * 
     * @param {*} object 
     */
    add(object)
    {
        let index = -1;

        // If there is available space in the list already
        if(this.count < this.contents.length)
        {
            // Find the first open index
            index = this.occupied.indexOf(false);
            this._insert(index);
        }
        else
        {
            // No open room in the list, push to back
            index = this._push(object);
        }

        return index;
    }

    addGroup(objects)
    {
        // First see if we have a vacant block long enough to hold all of the objects
        if(this.count < (this.contents.length - objects.length))
        {
            let consecutiveVacant = 0;
            let consecutiveStartIndex = 0;

            for(let i = 0; (i < this.contents.length) && (consecutiveVacant < objects.length); ++i)
            {
                // As we traverse the occupied list, increment the count of consecutive vacancies
                if(this.occupied[i] == false)
                {
                    if(consecutiveVacant == 0)
                    {
                        consecutiveStartIndex = i;
                    }

                    consecutiveVacant++;
                }
                else
                {
                    consecutiveVacant = 0;
                }
            }

            // Found a block of N vacancies?
            if(consecutiveVacant == objects.length)
            {
                for(let i = 0; i < objects.length; ++i)
                {
                    this._insert(objects[i], consecutiveStartIndex + i);
                }

                return consecutiveStartIndex;
            }
        }

        // Could not find a consecutive block, so push the entire group
        return this._pushGroup(objects);
    }

    remove(index)
    {
        this.occupied[index] = false;
    }

    get(index)
    {
        return this.contents[index];
    }

    _insert(object, index)
    {
        this.occupied[index] = true;
        this.contents[index] = object;
        this.count++;
    }

    _push(object)
    {
        this.contents.push(object);
        this.occupied.push(true);
        this.count++;

        return (this.contents.length - 1);
    }

    _pushGroup(objects)
    {
        let firstIndex = this.contents.length;

        for(let i = 0; i < objects.length; ++i)
        {
            this._push(objects[i]);
        }

        return firstIndex;
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

class AABB
{
    /**
     * 
     * @param {*} parent   Parent RenderableComponent that owns this AABB.
     * @param {*} xExtents The half extents along the x-axis.
     * @param {*} yExtents The half extents along the y-axis.
     */
    constructor(center, extents)
    {
        this.center   = center;
        this.extents  = extents;
    }

    intersectsAABB(other)
    {
        let thisMin = [this.center[0] - this.extents[0], this.center[1] - this.extents[1], this.center[2] - this.extents[2] ];
        let thisMax = [this.center[0] + this.extents[0], this.center[1] + this.extents[1], this.center[2] + this.extents[2] ];

        let otherMin = [other.center[0] - other.extents[0], other.center[1] - other.extents[1], other.center[2] - other.extents[2] ];
        let otherMax = [other.center[0] + other.extents[0], other.center[1] + other.extents[1], other.center[2] + other.extents[2] ];

        return !((thisMin[0] > otherMax[0]) || (otherMin[0] > thisMax[0]) ||
                 (thisMin[1] > otherMax[1]) || (otherMin[1] > thisMax[1]) ||
                 (thisMin[2] > otherMax[2]) || (otherMin[2] > thisMax[2]));
    }

    intersectsRect(rectangle)
    {
        const rectHalfX = rectangle.width / 2;
        const rectHalfY = rectangle.height / 2;

        let rectAABB = new AABB([rectangle.x + rectHalfX, rectangle.y + rectHalfY, 0.0], [rectHalfX, rectHalfY, Number.MAX_VALUE]);

        return this.intersectsAABB(rectAABB);
    }

    intersects(x, y, width, height)
    {
        const halfX = width / 2;
        const halfY = height / 2;

        let rectAABB = new AABB([x, y, 0.0], [halfX, halfY, Number.MAX_VALUE]);

        return this.intersectsAABB(rectAABB);
    }
}
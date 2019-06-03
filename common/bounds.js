/**
 * 
 */
class BoundsAABB
{
    /**
     * 
     * @param {*} parent  Parent RenderableComponent that owns this AABB.
     * @param {*} extents The half extents along the x-axis.
     */
    constructor(center = [0.0, 0.0, 0.0], extents = [0.0, 0.0, 0.0])
    {
        this.center   = center;
        this.extents  = extents;
    }

    min()
    {
        return [ this.center[0] - this.extents[0], this.center[1] - this.extents[1], this.center[2] - this.extents[2] ];
    }

    max()
    {
        return [ this.center[0] + this.extents[0], this.center[1] + this.extents[1], this.center[2] + this.extents[2] ];
    }
}

/**
 * 
 */
class BoundsSphere 
{
    constructor(center = [ 0.0, 0.0, 0.0 ], radius = 0.5)
    {
        this.center = center;
        this.radius = radius;
    }
}

/**
 * 
 */
class Ray
{
    constructor(origin = [ 0.0, 0.0, 0.0 ], direction = [ 0.0, 0.0, -1.0 ])
    {
        this.origin = origin;
        this.direction = direction;
    }
}

var IntersectionType = Object.freeze (
    { None: 0,              // There is no intersection and/or the object lies entirely outside the other
      Intersects: 1, 
      Inside: 2 });

/**
 * 
 */
class IntersectionResult
{
    constructor(result = IntersectionType.None, distance = undefined)
    {
        this.result = result;
        this.distance = distance;
    }
}

class Intersects
{
    /**
     * Performs intersection testing between a Ray and a BoundsSphere.
     * Result is returned as a `IntersectionResult` object.
     * 
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/Ray.cpp#L124
     * 
     * @param {Ray} ray 
     * @param {BoundsSphere} sphere
     * @returns {IntersectionResult}
     */
    static RayWithSphere(ray, sphere)
    {
        const l = [ 
            sphere.center[0] - ray.origin[0],
            sphere.center[1] - ray.origin[1],
            sphere.center[2] - ray.origin[2] ];

        const s  = dot(l, ray.direction);
        const l2 = dot(l, l);
        const rr = sphere.radius * sphere.radius;

        if((s >= 0.0) || (l2 < rr))
        {
            const m  = l2 - (s * s);
            const mm = m * m;

            if(mm <= rr)
            {
                const q = Math.sqrt(rr - mm);
                const distance = (l2 > rr) ? (s - q) : (s + q);

                return new IntersectionResult(IntersectionType.Intersects, distance);
            }
        }

        return new IntersectionResult();
    }

    /**
     * Performs intersection testing between a Ray and a BoundsAABB.
     * Result is returned as a `IntersectionResult` object.
     * 
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/Ray.cpp#L223
     * 
     * @param {Ray} ray 
     * @param {BoundsAABB} aabb
     * @returns {RayIntersection}
     */
    static RayWithAABB(ray, aabb)
    {
        let tMin = Number.NEGATIVE_INFINITY ;
        let tMax = Number.POSITIVE_INFINITY;
        let t0 = 0.0;
        let t1 = 0.0;

        const p = [ 
            aabb.center[0] - ray.origin[0],
            aabb.center[1] - ray.origin[1],
            aabb.center[2] - ray.origin[2] ];

        const d = ray.direction;
        const h = aabb.extents;

        for(let i = 0; i < 3; ++i)
        {
            let e = p[i];
            let f = d[i];

            if(Math.abs(f) > Number.EPSILON)
            {
                t0 = (e + h[i]) / f;
                t1 = (e - h[i]) / f;

                if(t0 > t1)
                {
                    let tTemp = t0;
                    t0 = t1;
                    t1 = tTemp;
                }

                if(t0 > tMin)
                {
                    tMin = t0;
                }

                if(t1 < tMax)
                {
                    tMax = t1;
                }

                if(tMin > tMax)
                {
                    return new IntersectionResult();
                }

                if(tMax < 0.0)
                {
                    return new IntersectionResult();
                }
            }
            else if(((-e - h[i]) > 0.0) || (-e + h[i] < 0.0))
            {
                return new IntersectionResult();
            }
        }

        return new IntersectionResult(IntersectionType.Intersects, (tMin > 0.0) ? tMin : tMax);
    }

    /**
     * Performs intersection testing with a generic rectangle whose origin is in it's center.
     * 
     * @param {BoundSphere} sphere
     * @param {Number} x X-component of the rectangle center
     * @param {Number} y Y-component of the rectangle center
     * @param {Number} halfWidth Half width of the rectangle
     * @param {Number} halfHeight Half height of the rectangle
     * @returns {IntersectionResult}
     */
    static RayWithRectangle(ray, x, y, halfWidth, halfHeight)
    {
        return Intersects.RayWithAABB(ray, new BoundsAABB([x, y, 0.0], [halfWidth, halfHeight, Number.MAX_VALUE]));
    }


    /**
     * Performs intersection testing between a Ray and a Plane.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/Ray.cpp#L468
     * 
     * @param {Ray} ray 
     * @param {Plane} plane
     * @returns {IntersectionResult}
     */
    static RayWithPlane(ray, plane)
    {
        console.error("Using unimplemented method Intersects.RayWithPlane");
    }

    /**
     * Performs intersection testing between two BoundSphere objects.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/BoundsSphere.cpp#L459
     * 
     * Returns an `IntersectionResult` value of either `None` (no intersection) or `Intersects`.
     * See also `SphereContainsSphere`.
     * 
     * @param {BoundsSphere} a
     * @param {BoundsSphere} b
     * @returns {IntersectionResult}
     */
    static SphereWithSphere(a, b)
    {
        const distance = [ 
            a.center[0] - b.center[0],
            a.center[1] - b.center[1],
            a.center[2] - b.center[2] ];

        const radiiSum = a.radius + b.radius;
        const distanceSquared = dot(distance, distance);
        const radiiSumSquared = radiiSum * radiiSum;
        const result = (distanceSquared > radiiSumSquared) ? IntersectionType.None : IntersectionType.Intersects;

        return new IntersectionResult(result);
    }

    /**
     * Performs intersection testing between a BoundsSphere and a BoundsAABB.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/BoundsSphere.cpp#L472
     * 
     * Returns an `IntersectionType` value of either `None` (no intersection) or `Intersects`.
     * See also `SphereContainsAABB` and `AABBContainsSphere`.
     * 
     * @param {BoundsSphere} sphere
     * @param {BoundsAABB} aabb
     * @returns {IntersectionResult}
     */
    static SphereWithAABB(sphere, aabb)
    {
        const aabbMin = aabb.min();
        const aabbMax = aabb.max();

        const a = [
            Math.max((aabbMin[0] - sphere.center[0]), 0.0),
            Math.max((aabbMin[1] - sphere.center[1]), 0.0),
            Math.max((aabbMin[2] - sphere.center[2]), 0.0) ]

        const b = [
            Math.max((sphere.center[0] - aabbMax[0]), 0.0),
            Math.max((sphere.center[1] - aabbMax[1]), 0.0),
            Math.max((sphere.center[2] - aabbMax[2]), 0.0) ]

        const c = a + b;
        const distance = dot(c, c);
        const result = (distance > (sphere.radius * sphere.radius)) ? IntersectionType.None : IntersectionType.Intersects;

        return new IntersectionResult(result);
    }

    /**
     * Performs intersection testing with a generic rectangle whose origin is in it's center.
     * 
     * @param {BoundSphere} sphere
     * @param {Number} x X-component of the rectangle center
     * @param {Number} y Y-component of the rectangle center
     * @param {Number} halfWidth Half width of the rectangle
     * @param {Number} halfHeight Half height of the rectangle
     * @returns {IntersectionResult}
     */
    static SphereWithRectangle(sphere, x, y, halfWidth, halfHeight)
    {
        return Intersects.SphereWithAABB(sphere, new BoundsAABB([x, y, 0.0], [halfWidth, halfHeight, Number.MAX_VALUE]));
    }

    /**
     * Performs intersection between a BoundsSphere and a Plane.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/BoundsSphere.cpp#L499
     * 
     * @param {BoundsSphere} sphere
     * @param {Plane} plane
     * @returns {IntersectionResult}
     */
    static SphereWithPlane(sphere, plane)
    {
        console.error("Using unimplemented method Intersects.SphereWithPlane");
    }

    /**
     * Performs intersection testing between two BoundsAABB objects.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/BoundsAABB.cpp#L261
     * 
     * @param {BoundsAABB} a
     * @param {BoundsAABB} b
     * @returns {IntersectionResult}
     */
    static AABBWithAABB(a, b)
    {
        const aMin = a.min();
        const aMax = a.max();

        const bMin = b.min();
        const bMax = b.max();

        const result =
            ((aMin[0] > bMax[0]) || (bMin[0] > aMax[0]) ||
             (aMin[1] > bMax[1]) || (bMin[1] > aMax[1]) ||
             (aMin[2] > bMax[2]) || (bMin[2] > aMax[2])) ? IntersectionType.None : IntersectionType.Intersects;

        return new IntersectionResult(result);
    }

    /**
     * Performs intersection testing with a generic rectangle whose origin is in it's center.
     * 
     * @param {BoundsAABB} aabb The AABB to perform the testing against.
     * @param {Number} x X-component of the rectangle center
     * @param {Number} y Y-component of the rectangle center
     * @param {Number} halfWidth Half width of the rectangle
     * @param {Number} halfHeight Half height of the rectangle
     * @returns {IntersectionResult}
     */
    static AABBWithRectangle(aabb, x, y, halfWidth, halfHeight)
    {
        return Intersects.AABBWithAABB(aabb, new BoundsAABB([x, y, 0.0], [halfWidth, halfHeight, Number.MAX_VALUE]));
    }

    /**
     * Performs intersection testing between a BoundsAABB and a Plane.
     * Source: https://github.com/ssell/OcularEngine/blob/master/OcularCore/src/Math/Bounds/BoundsAABB.cpp#L278
     * 
     * @param {BoundsAABB} aabb
     * @param {Plane} plane
     * @returns {IntersectionResult}
     */
    static AABBWithPlane(aabb, plane)
    {
        console.error("Using unimplemented method Intersects.AABBWithPlane");
    }
}
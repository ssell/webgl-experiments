/**
 * Collection of data representing a single vertex processed by a vertex shader.
 */
class Vertex
{
    constructor(posX, posY, posZ, r, g, b, a, normX, normY, normZ, u, v)
    {
        this.position = [posX, posY, posZ];
        this.color    = [r, g, b, a];
        this.normal   = [normX, normY, normZ]
        this.uv       = [u, v]
    }

    /**
     * Number of float elements in a single vertex.
     */
    static length()
    {
        return 12;
    }
}
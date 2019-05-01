/**
 * Represents the combination of a vertex and index buffer.
 * 
 * The `vertices` and `indices` members should be populated prior to calling `build`.
 */
class Mesh
{
    constructor()
    {
        this.vertices = [];
        this.indices = [];
    }

    /**
     * Builds the mesh based on the pre-specified vertices and indices.
     * It is expected that the `vertices` array is populated with instances of the `Vertex` class.
     * 
     * @param {*} context 
     */
    build(context)
    {
        if(this.vertices.length == 0)
        {
            console.error("Attempting to build a Mesh without first supplying vertices.");
            return;
        }

        if(this.indices.length == 0)
        {
            console.error("Attempting to build a Mesh without first supplying indices.");
            return;
        }

        this.vertexBuffer = context.gl.createBuffer();
        this.indexBuffer = context.gl.createBuffer();

        this.bind(context);

        this.buildVertexBuffer(context);
        this.buildIndexBuffer(context);
    }

    /**
     * Binds the underlying `vertexBuffer` and `indexBuffer` as the active `ARRAY_BUFFER`
     * and `ELEMENT_ARRAY_BUFFER`, respectively.
     * 
     * @param {*} context 
     */
    bind(context)
    {
        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
        context.gl.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }

    /**
     * Populates the `vertexBuffer` with the contents of the `vertices` array.
     * 
     * @param {*} context 
     */
    buildVertexBuffer(context)
    {
        const stride = Vertex.length();
        var size = this.vertices.length * stride;

        var vertexData = new Float32Array(size);

        for(var i = 0; i < size; i += stride)
        {
            var vertex = i / stride;

            vertexData[i + 0]  = this.vertices[vertex].position[0];
            vertexData[i + 1]  = this.vertices[vertex].position[1];
            vertexData[i + 2]  = this.vertices[vertex].position[2];
            
            vertexData[i + 3]  = this.vertices[vertex].color[0];
            vertexData[i + 4]  = this.vertices[vertex].color[1];
            vertexData[i + 5]  = this.vertices[vertex].color[2];
            vertexData[i + 6]  = this.vertices[vertex].color[3];

            vertexData[i + 7]  = this.vertices[vertex].normal[0];
            vertexData[i + 8]  = this.vertices[vertex].normal[1];
            vertexData[i + 9]  = this.vertices[vertex].normal[2];
            
            vertexData[i + 10] = this.vertices[vertex].uv[0];
            vertexData[i + 11] = this.vertices[vertex].uv[1];
        }

        context.gl.bufferData(context.gl.ARRAY_BUFFER, vertexData, context.gl.STATIC_DRAW);
    }

    /**
     * Populates the `indexBuffer` with the contents of the `indices` array.
     * 
     * @param {*} context 
     */
    buildIndexBuffer(context)
    {
        context.gl.bufferData(context.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), context.gl.STATIC_DRAW);
    }

    /**
     * Binds the underlying buffers and calls `drawElements` to render them.
     * 
     * @param {*} context 
     */
    render(context)
    {
        this.bind(context);
        
        context.gl.drawElements(context.gl.TRIANGLES, this.indices.length, context.gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Binds the underlying buffers and calls `drawElementsInstanced` to render them.
     * 
     * @param {*} context 
     * @param {*} instanceCount Number of instances of this mesh to render.
     */
    renderInstanced(context, instanceCount)
    {
        this.bind(context);

        context.gl.drawElementsInstanced(context.gl.TRIANGLES, this.indices.length, context.gl.UNSIGNED_SHORT, 0, instanceCount);
    }
}
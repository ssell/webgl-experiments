/**
 * 
 */
class Mesh
{
    constructor()
    {
        this.vertices = [];
        this.indices = [];
    }

    build(context)
    {
        this.vertexBuffer = context.gl.createBuffer();
        this.indexBuffer = context.gl.createBuffer();

        this.bind(context);

        this.buildVertexBuffer(context);
        this.buildIndexBuffer(context);
    }

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

    buildIndexBuffer(context)
    {
        context.gl.bufferData(context.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), context.gl.STATIC_DRAW);
    }

    bind(context)
    {
        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.vertexBuffer);
        context.gl.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }

    render(context)
    {
        this.bind(context);
        
        context.gl.drawElements(context.gl.TRIANGLES, this.indices.length, context.gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * 
 */
class MeshManager
{
    meshes = new Map();

    constructor()
    {

    }

    addMesh(id, mesh)
    {
        if(this.meshes.has(id))
        {
            return false;
        }
        
        this.meshes.set(id, mesh);
        return true;
    }

    getMesh(id)
    {
        if(this.meshes.has(id))
        {
            return this.meshes.get(id);
        }
        
        return null;
    }
}
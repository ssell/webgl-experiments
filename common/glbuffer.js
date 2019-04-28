/**
 * 
 */
class GLBuffer
{
    constructor(context, positions)
    {
        this.positionBuffer = context.gl.createBuffer();
        this.internal_bind(context);
        
        context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(positions), context.gl.STATIC_DRAW);
    }

    internal_bind(context)
    {
        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.positionBuffer);
    }

    bind(context, shader)
    {
        this.internal_bind(context);

        context.gl.vertexAttribPointer(
            shader.vertexPosition,
            2,
            context.gl.FLOAT,
            false,
            0,
            0);

        context.gl.enableVertexAttribArray(shader.vertexPosition);
    }
}
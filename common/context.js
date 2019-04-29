/**
 * 
 */
class Context
{
    /**
     * 
     * @param {*} canvasId Id of the canvas element to render to.
     */
    constructor(canvasId)
    {
        this.canvas = document.querySelector("#" + canvasId);
        this.gl = this.canvas.getContext("webgl2");

        if(this.gl === null)
        {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        }

        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.projectionMatrix = mat4.create();
        this.modelViewMatrix = mat4.create();
    }

    /**
     * Sets the clear color for the back buffer.
     * @param {*} r 
     * @param {*} g 
     * @param {*} b 
     * @param {*} a 
     */
    setClearColor(r, g, b, a)
    {
        this.gl.clearColor(r, g, b, a);
    }

    /**
     * Clears the back buffer.
     */
    clearBuffers()
    {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 
     * @param {*} offset 
     * @param {*} vertexCount 
     */
    drawArraysTriangleStrip(offset, vertexCount)
    {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    /**
     * 
     * @param {*} fov 
     * @param {*} aspect 
     * @param {*} near 
     * @param {*} far 
     */
    setProjectionPerspective(fov, aspect, near, far)
    {
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    }

    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    translate(x, y, z, reset = false)
    {
        if(reset == true)
        {
            this.modelViewMatrix = mat4.create();
        }

        mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [x, y, z]);
    }
}
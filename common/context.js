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
        this.gl = this.canvas.getContext("webgl");

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
    translate(x, y, z)
    {
        mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [x, y, z]);
    }
}

var glContext;

/**
 * Creates and initializes the global WebGL Context (glContext).
 */
function initializeWebGL()
{
    glContext = new Context("glCanvas");
    glContext.setClearColor(0.1, 0.1, 0.2, 1.0);
    glContext.clearBuffers();

    var fov = 45 * Math.PI / 180;
    var aspect = glContext.gl.canvas.clientWidth / glContext.gl.canvas.clientHeight;
    var near = 0.1;
    var far = 100.0;

    glContext.setProjectionPerspective(fov, aspect, near, far);
    glContext.translate(0.0, 0.0, 0.0);
}
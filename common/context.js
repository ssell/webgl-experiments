/**
 * Resposible for retrieving the WebGL context and wrapping
 * some of the core GL calls. It also houses the common uniforms.
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
            alert("Error: Your browser does not support use of WebGL 2 Contexts. For more information, see:\n\nhttps://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext#Browser_compatibility");
        }

        this.enableExtensions();

        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.resources = new ResourceManager();
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
    }

    enableExtensions()
    {
        var extensions = this.gl.getSupportedExtensions();

        console.info("Supported WebGL extensions:");

        for(let i = 0; i < extensions.length; ++i)
        {
            console.info("\t" + extensions[i]);
        }

        var extColorBufferFloat = this.gl.getExtension("OES_texture_float_linear");

        if (!extColorBufferFloat) 
        {
            alert('Warning: Your browser does not support linear sampling of floating-point textures. For more information, see:\n\nhttps://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float_linear#Browser_compatibility');
            return;
        }
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
}

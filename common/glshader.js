/**
 * 
 */
class GLShader
{
    constructor(context, vsSource, gsSource, fsSource)
    {
        this.shaderProgram = null;

        // Upload and compile the shader sources
        const vs = this.loadShader(context, context.gl.VERTEX_SHADER, vsSource);
        const gs = this.loadShader(context, context.gl.GEOMETRY_SHADER, gsSource);
        const fs = this.loadShader(context, context.gl.FRAGMENT_SHADER, fsSource);

        if((vs === null) || (fs === null))
        {
            alert("Failed to create required Vertex and/or Fragment shader");
            return;
        }
        
        this.createProgram(context, vs, gs, fs);
        this.bindLocations(context);
    }

    /**
     * Creates a shader of the specified type from the provided source.
     * If shader compilation fails, returns null.
     * 
     * @param {*} gl WebGL context
     * @param {*} type Shader type (VERTEX_SHADER, GEOMETRY_SHADER, or FRAGMENT_SHADER)
     * @param {*} source Text source of the shader
     */
    loadShader(context, type, source)
    {
        if(source === null)
        {
            return null;
        }

        const shader = context.gl.createShader(type);
        
        context.gl.shaderSource(shader, source);
        context.gl.compileShader(shader);

        if(!context.gl.getShaderParameter(shader, context.gl.COMPILE_STATUS))
        {
            alert("An error occurred during shader compilation: " + context.gl.getShaderInfoLog(shader));
            context.gl.deleteShader(shader);

            return null;
        }

        return shader;
    }

    /**
     * Attempts to link the provided shaders into a shader program.
     * 
     * @param {*} gl WebGL context
     * @param {*} vs Compiled Vertex Shader (required)
     * @param {*} gs Compiled Geometry Shader (optional)
     * @param {*} fs Compiled Fragment Shader ()
     */
    createProgram(context, vs, gs, fs)
    {
        this.shaderProgram = context.gl.createProgram();

        context.gl.attachShader(this.shaderProgram, vs);
        context.gl.attachShader(this.shaderProgram, fs);

        if(gs != null)
        {
            context.gl.attachShader(this.shaderProgram, gs);
        }

        context.gl.linkProgram(this.shaderProgram);

        // Check for success
        if(!context.gl.getProgramParameter(this.shaderProgram, context.gl.LINK_STATUS))
        {
            alert("Unable to initialize shader program: " + context.gl.getProgramInfoLog(this.shaderProgram));
            this.shaderProgram = null;
        }
    }

    /**
     * 
     * @param {*} gl 
     */
    bindLocations(context)
    {
        if(this.shaderProgram === null)
        {
            return;
        }

        this.vertexPosition = context.gl.getAttribLocation(this.shaderProgram, "VertexPosition");
        this.projectionMatrix = context.gl.getUniformLocation(this.shaderProgram, "ProjectionMatrix");
        this.modelViewMatrix = context.gl.getUniformLocation(this.shaderProgram, "ModelViewMatrix");
    }

    bind(context)
    {
        context.gl.useProgram(this.shaderProgram);
        context.gl.uniformMatrix4fv(this.projectionMatrix, false, context.projectionMatrix);
        context.gl.uniformMatrix4fv(this.modelViewMatrix, false, context.modelViewMatrix);
    }
}
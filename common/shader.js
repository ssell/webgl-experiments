/**
 * Wraps an underlying WebGL shader program composed of the following:
 * 
 *     - Vertex Shader   (Mandatory)
 *     - Fragment Shader (Mandatory)
 *     - Geometry Shader (Optional)
 */
class Shader extends Resource
{
    constructor(context, name, vsSource, gsSource, fsSource)
    {
        super(context, name, ResourceType.Shader);

        this.shaderProgram = null;

        // Upload and compile the shader sources
        const vs = this.loadShader(this.context.gl.VERTEX_SHADER,   vsSource);
        const gs = this.loadShader(this.context.gl.GEOMETRY_SHADER, gsSource);
        const fs = this.loadShader(this.context.gl.FRAGMENT_SHADER, fsSource);

        if((vs === null) || (fs === null))
        {
            alert("Failed to create required Vertex and/or Fragment shader");
            return;
        }
        
        this.createProgram(vs, gs, fs);
        this.findProperties();
    }

    /**
     * Creates a shader of the specified type from the provided source.
     * If shader compilation fails, returns null.
     * 
     * @param {*} type Shader type (VERTEX_SHADER, GEOMETRY_SHADER, or FRAGMENT_SHADER)
     * @param {*} source Text source of the shader
     */
    loadShader(type, source)
    {
        if(source === null)
        {
            return null;
        }

        const shader = this.context.gl.createShader(type);
        
        this.context.gl.shaderSource(shader, source);
        this.context.gl.compileShader(shader);

        if(!this.context.gl.getShaderParameter(shader, this.context.gl.COMPILE_STATUS))
        {
            alert("An error occurred during shader compilation: " + this.context.gl.getShaderInfoLog(shader));
            this.context.gl.deleteShader(shader);

            return null;
        }

        return shader;
    }

    /**
     * Attempts to link the provided shaders into a shader program.
     * 
     * @param {*} vs Compiled Vertex Shader (required)
     * @param {*} gs Compiled Geometry Shader (optional)
     * @param {*} fs Compiled Fragment Shader ()
     */
    createProgram(vs, gs, fs)
    {
        this.shaderProgram = this.context.gl.createProgram();

        this.context.gl.attachShader(this.shaderProgram, vs);
        this.context.gl.attachShader(this.shaderProgram, fs);

        if(gs != null)
        {
            this.context.gl.attachShader(this.shaderProgram, gs);
        }

        this.context.gl.linkProgram(this.shaderProgram);

        // Check for success
        if(!this.context.gl.getProgramParameter(this.shaderProgram, this.context.gl.LINK_STATUS))
        {
            alert("Unable to initialize shader program: " + this.context.gl.getProgramInfoLog(this.shaderProgram));
            this.shaderProgram = null;
        }
    }

    /**
     * Find and the uniforms and attributes defined in all shaders (well, in shader_common).
     */
    findProperties()
    {
        if(this.shaderProgram === null)
        {
            return;
        }
        
        this.viewMatrix       = this.context.gl.getUniformLocation(this.shaderProgram, "ViewMatrix");
        this.projectionMatrix = this.context.gl.getUniformLocation(this.shaderProgram, "ProjectionMatrix");
        
        this.vertexPosition = this.context.gl.getAttribLocation(this.shaderProgram, "VertexPosition");
        this.vertexColor    = this.context.gl.getAttribLocation(this.shaderProgram, "VertexColor");
        this.vertexNormal   = this.context.gl.getAttribLocation(this.shaderProgram, "VertexNormal");
        this.vertexUV       = this.context.gl.getAttribLocation(this.shaderProgram, "VertexUV");
    }

    bind()
    {
        this.context.gl.useProgram(this.shaderProgram);

        this.bindCommonUniforms();
        this.bindCommonAttributes();

        return true;
    }

    bindCommonUniforms()
    {
        this.context.gl.uniformMatrix4fv(this.viewMatrix, false, this.context.viewMatrix);
        this.context.gl.uniformMatrix4fv(this.projectionMatrix, false, this.context.projectionMatrix);
    }

    bindCommonAttributes()
    {
        const vertLength = Vertex.length() * 4;
        
        if(this.vertexPosition != -1) 
        { 
            this.context.gl.vertexAttribPointer(this.vertexPosition, 3, this.context.gl.FLOAT, false, vertLength, 0 * 4);
            this.context.gl.enableVertexAttribArray(this.vertexPosition);
        }

        if(this.vertexColor != -1) 
        {    
            this.context.gl.vertexAttribPointer(this.vertexColor, 4, this.context.gl.FLOAT, false, vertLength, 4 * 3); 
            this.context.gl.enableVertexAttribArray(this.vertexColor);
        }

        if(this.vertexNormal != -1) 
        {    
            this.context.gl.vertexAttribPointer(this.vertexNormal, 3, this.context.gl.FLOAT, false, vertLength, 4 * 7); 
            this.context.gl.enableVertexAttribArray(this.vertexNormal);
        }

        if(this.vertexUV != -1) 
        {       
            this.context.gl.vertexAttribPointer(this.vertexUV, 2, this.context.gl.FLOAT, false, vertLength, 4 * 10);
            this.context.gl.enableVertexAttribArray(this.vertexUV);
        }
    }
}
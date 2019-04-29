class Renderer
{
    constructor(canvasId)
    {
        this.context   = new Context(canvasId);
        this.meshes    = new MeshManager();
        this.shaders   = new ShaderManager();
        this.cameraPos = [0.0, 0.0, -10.0];

        this.initializeWebGL(canvasId);
    }

    initializeWebGL(canvasId)
    {
        this.context.setClearColor(0.1, 0.1, 0.2, 1.0);
        this.context.clearBuffers();

        var fov    = 45 * Math.PI / 180;
        var aspect = this.context.gl.canvas.clientWidth / this.context.gl.canvas.clientHeight;
        var near   = 0.1;
        var far    = 100.0;

        this.context.setProjectionPerspective(fov, aspect, near, far);
        this.context.translate(0.0, 0.0, 0.0);
    }

    pushTransform(transform)
    {
        // This is all wrong.
        // There needs to be a separate model and view matrix.
        this.context.translate(
            transform.position[0],
            transform.position[1],
            transform.position[2],
            true
        );
    }

    popTransform()
    {
        this.context.translate(
            this.cameraPos[0],
            this.cameraPos[1],
            this.cameraPos[2],
            true
        );
    }

    render(delta, shader, mesh)
    {
        shader.bind(this.context);
        mesh.render(this.context);
    } 
}

function buildFlatShader(renderer)
{
    shader = new Shader(renderer.context, shader_flat_vs, null, shader_flat_fs);
    renderer.shaders.addShader("flat", shader);
}

function buildQuad(renderer)
{
    quad = new Mesh();

    quad.vertices.push(new Vertex(-0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0), 
                       new Vertex( 0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0), 
                       new Vertex( 0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0),
                       new Vertex(-0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0));

    quad.indices.push(0, 1, 2, 
                      2, 3, 0)

    quad.build(renderer.context);

    renderer.meshes.addMesh("quad", quad);
}

$(document).ready(function()
{
    var renderer = new Renderer("glCanvas");

    buildFlatShader(renderer);
    buildQuad(renderer);

    var object = new SceneObject(renderer);
    object.mesh = "quad";
    object.shader = "flat";
    object.transform.position = [0.0, 0.0, 0.0];
    
    object.render(0.0);
});
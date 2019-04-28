var shader = null;
var buffer = null;
var mesh = null;

function render()
{
    glContext.clearBuffers();

    glContext.translate(0.0, 0.0, -15.0);
    
    shader.bind(glContext);
    mesh.render(glContext);
}

$(document).ready(function()
{
    initializeWebGL();

    shader = new GLShader(glContext, shader_flat_vs, null, shader_flat_fs);

    mesh = new Mesh();

    mesh.vertices.push(new Vertex(-1.0, -1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0), 
                       new Vertex( 1.0, -1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0), 
                       new Vertex( 1.0,  1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0),
                       new Vertex(-1.0,  1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0));

    mesh.indices.push(0, 1, 2, 
                      2, 3, 0)

    mesh.build(glContext);

    render();
});
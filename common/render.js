var shader = null;
var buffer = null;

function render()
{
    glContext.clearBuffers();

    glContext.translate(0.0, 0.0, -5.0);
    
    buffer.bind(glContext, shader);
    shader.bind(glContext);

    glContext.drawArraysTriangleStrip(0, 4);
}

$(document).ready(function()
{
    initializeWebGL();

    shader = new GLShader(glContext, shader_flat_vs, null, shader_flat_fs);
    buffer = new GLBuffer(glContext, 
        [-1.0,  1.0, 
          1.0,  1.0, 
         -1.0, -1.0, 
          1.0, -1.0]);

    render();
});
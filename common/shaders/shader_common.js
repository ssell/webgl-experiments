const shader_common_vs = `
    uniform mat4 ModelMatrix;
    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;

    attribute vec4 VertexPosition;
    attribute vec4 VertexColor;
    attribute vec3 VertexNormal;
    attribute vec2 VertexUV;
    
    vec4 transformPosition()
    {
        return (ProjectionMatrix * ViewMatrix * ModelMatrix) * VertexPosition;
    }
`;

const shader_common_fs = `

`;
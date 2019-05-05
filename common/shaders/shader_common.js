const shader_common_vs = `
    uniform mat4 ModelMatrix;
    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;
    uniform vec4 FrameInfo;              // [Frame Number, Time Elapsed, Frame Delta, 0]
    
    attribute vec4 VertexPosition;
    attribute vec4 VertexColor;
    attribute vec3 VertexNormal;
    attribute vec2 VertexUV;
    
    vec4 transformPosition()
    {
        return (ProjectionMatrix * ViewMatrix * ModelMatrix) * VertexPosition;
    }
`;

const shader_common_vs_instanced = `
    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;
    uniform vec4 FrameInfo;

    attribute mat4 ModelMatrix;
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

const shader_common_fs_instanced = `

`;
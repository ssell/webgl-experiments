const shader_common_vs = `
    uniform mat4 ModelMatrix;
    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;
    uniform vec4 FrameInfo;              // [Frame Number, Time Elapsed, Frame Delta, 0]

    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;
    
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

    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;

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
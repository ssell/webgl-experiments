// Using the VS Code extension `glsl-literal` for GLSL syntax highlighting in glsl`...` strings.
const glsl = x => x;

const shader_common_vs = glsl`
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

const shader_common_vs_instanced = glsl`
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

const shader_common_fs = glsl`
    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;

    precision mediump float;
`;

const shader_common_fs_instanced = glsl`
    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;

    precision mediump float;
`;
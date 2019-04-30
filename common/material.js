class MaterialPropertyRecord
{
    constructor(name, defaultValue, size, location)
    {
        this.name     = name;
        this.default  = defaultValue;
        this.size     = size;
        this.location = location;
    }
}

class Material
{
    constructor(renderer, materialName, shaderName, instanced = false)
    {
        this.renderer   = renderer;
        this.name       = materialName;
        this.shader     = renderer.shaders.get(shaderName);
        this.instanced  = instanced;
        this.uniforms   = new Map();
        this.references = 0;
        this.properties = [];

        this.enableProperty("ModelMatrix", 16, mat4.create());
    }

    enableProperty(name, size, defaultValue)
    {
        if(this.properties.indexOf(name) === -1)
        {
            let location = this.renderer.context.gl.getUniformLocation(this.shader.shaderProgram, name);
            this.properties.push(new MaterialPropertyRecord(name, defaultValue, size, location));
        }
    }

    disableProperty(name)
    {
        let index = this.properties.indexOf(name);

        if(index != -1)
        {
            this.properties.splice(index, 1);
        }
    }

    setUniformFloat(name, value)
    {
        this.setUniform(name, value, 1, this.renderer.context.gl.FLOAT);
    }

    setUniformVec3(name, value)
    {
        this.setUniform(name, value, 3, this.renderer.context.gl.FLOAT);
    }

    setUniformVec4(name, value)
    {
        this.setUniform(name, value, 4, this.renderer.context.gl.FLOAT);
    }

    setUniformMat4(name, value)
    {

    }

    setUniform(name, value, size, type)
    {
        if(this.uniforms.has(name))
        {
            this.uniforms.delete(name);
        }

        this.uniforms.set(name, new MaterialPropertyUniform(this.shader, name, value, type, size, this.renderer.context));
    }

    bind(context, sceneObject)
    {
        if(this.shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this.shader.bind(this.renderer.context))
        {
            return false;
        }

        //this.bindUniforms();
        this.bindProperties(sceneObject);

        return true;
    }

    bindUniforms()
    {
        let uniformIter = this.uniforms.keys();
        let uniform = uniformIter.next();

        while(!uniform.done)
        {
            this.uniforms.get(uniform.value).bind();
            uniform = uniformIter.next();
        }
    }

    bindProperties(sceneObject)
    {
        if(this.instanced === true)
        {
            
        }
        else
        {
            this.bindNonInstancedProperties(sceneObject);
        }
    }

    bindNonInstancedProperties(sceneObject)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let record = this.properties[i];
            let value  = record.default;

            if(record.name === "ModelMatrix")
            {
                value = sceneObject.modelMatrix();
            }
            else if(sceneObject.materialProps.properties.has(record.name))
            {
                value = sceneObject.materialProps.properties.get(record.name).value;  
            }

            switch(record.size)
            {
                case 1:
                this.renderer.context.gl.uniform1fv(record.location, value);
                break;

                case 2:
                this.renderer.context.gl.uniform2fv(record.location, value);
                break;

                case 3:
                this.renderer.context.gl.uniform3fv(record.location, value);
                break;

                case 4:
                this.renderer.context.gl.uniform4fv(record.location, value);
                break;

                case 16:
                this.renderer.context.gl.uniformMatrix4fv(record.location, false, value);
                break;
            }
        }
    }
}

class MaterialPropertyUniform
{
    constructor(shader, name, value, type, size, context)
    {
        this.context  = context;
        this.name     = name;
        this.value    = value;
        this.type     = type;
        this.size     = size;
        this.location = context.gl.getUniformLocation(shader.shaderProgram, this.name);
    }

    bind()
    {
        if(this.location == -1)
        {
            return;
        }
        
        switch(this.size)
        {
            case 1:
            this.context.gl.uniform1fv(this.location, this.value);
            break;

            case 2:
            this.context.gl.uniform2fv(this.location, this.value);
            break;

            case 3:
            this.context.gl.uniform3fv(this.location, this.value);
            break;

            case 4:
            this.context.gl.uniform4fv(this.location, this.value);
            break;
        }
    }
}

class MaterialProperty
{
    constructor(name, value, size, type)
    {
        this.name  = name;
        this.value = value;
        this.size  = size;
        this.type  = type;
    }
}

/**
 * 
 */
class MaterialPropertyBlock
{
    constructor()
    {
        this.properties = new Map();
        this.dirty = true;
    }

    setPropertyFloat(name, value)
    {
        this.setProperty(name, value, 1, 0x1406);
    }

    setPropertyVec2(name, value)
    {
        this.setProperty(name, value, 2, 0x1406);
    }

    setPropertyVec3(name, value)
    {
        this.setProperty(name, value, 3, 0x1406);
    }

    setPropertyVec4(name, value)
    {
        this.setProperty(name, value, 4, 0x1406);
    }

    setPropertyMatrix4(name, value)
    {

    }

    setProperty(name, value, size, type)
    {
        if(this.properties.has(name))
        {
            this.properties.delete(name);
        }

        this.properties.set(name, new MaterialProperty(name, value, size, type));
        this.dirty = true;
    }
}
class Material
{
    _shader = null;
    
    constructor(renderer, materialName, shaderName)
    {
        this.renderer   = renderer;
        this.name       = materialName;
        this.shader     = shaderName;
        this.attributes = new Map();
        this.references = 0;
    }
    
    set shader(name)
    {
        this._shader = this.renderer.shaders.get(name);
    }

    associate(sceneObject)
    {
        this.references++;
    }

    disassociate(sceneObject)
    {
        this.references--;
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
        if(this.attributes.has(name))
        {
            this.attributes.delete(name);
        }

        this.attributes.set(name, new MaterialPropertyUniform(this._shader, name, value, type, size, this.renderer.context));
    }

    bind(context)
    {
        if(this._shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this._shader.bind(this.renderer.context))
        {
            return false;
        }

        let attribIter = this.attributes.keys();
        let attribute = attribIter.next();

        while(!attribute.done)
        {
            this.attributes.get(attribute.value).bind();
            attribute = attribIter.next();
        }

        return true;
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

class MaterialPropertyAttribute
{
    constructor()
    {

    }
}
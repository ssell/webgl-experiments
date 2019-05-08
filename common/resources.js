var ResourceType = 
{
    Mesh: 1,
    Shader: 2,
    Material: 3
};

class ResourceManager
{
    _resources = [];

    constructor()
    {
        this.defaultMesh              = "quad";
        this.defaultMaterial          = "default";
        this.defaultInstancedMaterial = "default_instanced";
    }
    
    addResource(resource)
    {
        resource.resourceId = this._resources.length;
        this._resources.push(resource);
    }

    removeResource(resource)
    {
        console.error("Not implemented");
    }

    getResource(id)
    {
        if(_resources.length > id)
        {
            return this._resources[id];
        }

        return null;
    }

    getResourceByNameType(name, type)
    {
        let resource = null;

        for(let i = 0; i < this._resources.length; ++i)
        {
            resource = this._resources[i];

            if((resource.resourceName === name) && (resource.resourceType == type))
            {
                break;
            }
        }

        return resource;
    }

    getMesh(name)
    {
        return this.getResourceByNameType(name, ResourceType.Mesh);
    }

    getShader(name)
    {
        return this.getResourceByNameType(name, ResourceType.Shader);
    }

    getMaterial(name)
    {
        return this.getResourceByNameType(name, ResourceType.Material);
    }
}

class Resource
{
    constructor(context, resourceName, resourceType)
    {
        this.context      = context;
        this.resourceId   = -1;
        this.resourceName = resourceName;
        this.resourceType = resourceType;
        
        this.context.resources.addResource(this);
    }
}
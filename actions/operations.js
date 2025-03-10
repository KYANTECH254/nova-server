const prisma = require("../prisma")

async function getPlatformConfig(platformID) {
  try {
    const config = await prisma.platformSetting.findUnique({
      where: { platformID }
    });

    if (!config) {
      return null;
    }

    return config;
  } catch (error) {
    console.error('Error fetching platform configuration:', error);
    throw error;
  }
}

async function updatePlatformConfig(platformID, data) {
  try {
    const config = await prisma.platformSetting.update({
      where: { platformID },
      data
    });

    return config;
  } catch (error) {
    console.error('Error updating platform configuration:', error);
    throw error;
  }
}

async function deletePlatformConfig(platformID) {
  try {
    await prisma.platformSetting.delete({
      where: { platformID }
    });
  } catch (error) {
    console.error('Error deleting platform configuration:', error);
    throw error;
  }
}

async function createPlatformConfig(platformID, data) {
  try {
    const config = await prisma.platformSetting.create({
      data: {
        platformID,
        ...data
      }
    });

    return config;
  } catch (error) {
    console.error('Error creating platform configuration:', error);
    throw error;
  }
}

async function getSuperUser() {
  try {
    const superUser = await prisma.superUser.findFirst();
    return superUser;
  } catch (error) {
    console.error('Error fetching super user:', error);
    throw error;
  }
}

async function createSuperUser(data) {
  try {
    const superUser = await prisma.superUser.create({
      data
    });
    return superUser;
  } catch (error) {
    console.error('Error creating super user:', error);
    throw error;
  }
}

async function updateSuperUser(data) {
  try {
    const superUser = await prisma.superUser.update({
      where: { id: data.id },
      data
    });
    return superUser;
  } catch (error) {
    console.error('Error updating super user:', error);
    throw error;
  }
}

async function deleteSuperUser(id) {
  try {
    const superUser = await prisma.superUser.delete({
      where: { id }
    });
    return superUser;
  } catch (error) {
    console.error('Error deleting super user:', error);
    throw error;
  }
}

async function createUser(data) {
  try {
    const user = await prisma.user.create({
      data
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function updateUser(id, data) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const user = await prisma.user.delete({
      where: { id }
    });
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

async function addMpesaCode(data) {
  try {
    const mpesaCode = await prisma.mpesaCode.create({
      data
    });
    return mpesaCode;
  } catch (error) {
    console.error('Error adding mpesa code:', error);
    throw error;
  }
}

async function updateMpesaCode(id, data) {
  try {
    const mpesaCode = await prisma.mpesaCode.update({
      where: { id },
      data
    });
    return mpesaCode;
  } catch (error) {
    console.error('Error updating mpesa code:', error);
    throw error;
  }
}

async function createAdmin(data) {
  try {
    const admin = await prisma.admin.create({
      data
    });
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

async function updateAdmin(id, data) {
  try {
    const admin = await prisma.admin.update({
      where: { id },
      data
    });
    return admin;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
}

async function deleteAdmin(id) {
  try {
    const admin = await prisma.admin.delete({
      where: { id }
    });
    return admin;
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
}

async function createPackage(data) {
  try {
    const package = await prisma.package.create({
      data
    });
    return package;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
}

async function updatePackage(id, data) {
  try {
    const package = await prisma.package.update({
      where: { id },
      data
    });
    return package;
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
}

async function getPackage(id) {
  try {
    const package = await prisma.package.findUnique({
      where: { id }
    });
    return package;
  } catch (error) {
    console.error('Error getting package:', error);
    throw error;
  }
}

async function getPackages(platformID) {
  try {
    const packages = await prisma.package.findMany({
      where: { platformID }
    });
    return packages;
  } catch (error) {
    console.error('Error getting packages:', error);
    throw error;
  }
}

async function deletePackage(id) {
  try {
    const package = await prisma.package.delete({
      where: { id }
    });
    return package;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
}

async function createPlatform (data) {
  try {
    const platform = await prisma.platform.create({
      data
    });
    return platform;
  } catch (error) {
    console.error('Error creating platform:', error);
    throw error;
  }
}

async function updatePlatform (id, data) {
  try {
    const platform = await prisma.platform.update({
      where: { id },
      data
    });
    return platform;
  } catch (error) {
    console.error('Error updating platform:', error);
    throw error;
  }
} 

async function deletePlatform (id) {
  try {
    const platform = await prisma.platform.delete({
      where: { id }
    });
    return platform;
  } catch (error) {
    console.error('Error deleting platform:', error);
    throw error;
  }
}

async function getPlatform (platformID) {
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID }
    });
    return platform;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

module.exports = { getPlatformConfig, updatePlatformConfig, deletePlatformConfig, createPlatformConfig, getSuperUser, createSuperUser, updateSuperUser, deleteSuperUser, createUser, updateUser, deleteUser };

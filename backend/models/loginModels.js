const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    employer: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    facility: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'co-admin', 'admin'],
        default: 'user'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    allowedModules: {
        type: [String],
        default: function() {
            return ['/order-static/', '/menue-static/'];
        },
        set: function(modules) {
            return modules.map(module => {
                let formattedModule = module;
                if (!formattedModule.startsWith('/')) {
                    formattedModule = '/' + formattedModule;
                }
                if (!formattedModule.endsWith('/')) {
                    formattedModule += '/';
                }
                if (!formattedModule.includes('-static')) {
                    formattedModule = formattedModule.replace('/', '-static/');
                }
                return formattedModule;
            });
        },
        get: function(modules) {
            if (!modules) return [];
            return modules.map(module => {
                let formattedModule = module;
                if (!formattedModule.startsWith('/')) {
                    formattedModule = '/' + formattedModule;
                }
                if (!formattedModule.endsWith('/')) {
                    formattedModule += '/';
                }
                if (!formattedModule.includes('-static')) {
                    formattedModule = formattedModule.replace('/', '-static/');
                }
                return formattedModule;
            });
        }
    },
    allowedFacilities: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Vor dem Speichern Passwort hashen und Berechtigungen setzen
userSchema.pre('save', async function(next) {
    try {
        const collection = this.collection;
        const indexes = await collection.indexes();
        const usernameIndex = indexes.find(index => index.key.username);
        
        if (usernameIndex) {
            await collection.dropIndex('username_1');
        }

        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
        }

        // Berechtigungen basierend auf der Rolle setzen
        if (this.isModified('role')) {
            if (this.role === 'admin') {
                this.allowedFacilities = [];
            } else if (this.role === 'co-admin') {
                this.allowedFacilities = [this.facility];
            } else {
                if (!this.allowedFacilities || this.allowedFacilities.length === 0) {
                    this.allowedFacilities = [this.facility];
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Passwort vergleichen
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Migrations-Funktion
userSchema.statics.migratePermissions = async function() {
    const users = await this.find({});
    for (const user of users) {
        // Konvertiere altes Permissions-Format in neues Format
        if (Array.isArray(user.permissions)) {
            const newPermissions = {
                viewAll: false,
                editAll: false,
                deleteAll: false,
                viewStats: false,
                manageAdmins: false,
                facilityOnly: true
            };

            // Setze Berechtigungen basierend auf der Rolle
            if (user.role === 'admin') {
                Object.keys(newPermissions).forEach(key => {
                    newPermissions[key] = key === 'facilityOnly' ? false : true;
                });
            } else if (user.role === 'co-admin') {
                newPermissions.deleteAll = true;
                newPermissions.viewStats = true;
            }

            user.permissions = newPermissions;
            await user.save();
        }
    }
};

const User = mongoose.model('User', userSchema);

// Führe Migration beim Start aus
User.migratePermissions().catch(console.error);

module.exports = User;

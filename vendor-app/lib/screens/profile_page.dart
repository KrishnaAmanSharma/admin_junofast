import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../configs/app_constants.dart';
import '../services/profile_controller.dart';
import '../services/auth_service.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late ProfileController profileController;
  late AuthService authService;
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _businessNameController = TextEditingController();
  final _cityController = TextEditingController();
  final _addressController = TextEditingController();
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      profileController = Provider.of<ProfileController>(context, listen: false);
      authService = Provider.of<AuthService>(context, listen: false);
      _loadProfileData();
    });
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _businessNameController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _loadProfileData() {
    final vendor = profileController.vendorProfile;
    if (vendor != null) {
      _fullNameController.text = vendor.fullName;
      _phoneController.text = vendor.phoneNumber;
      _businessNameController.text = vendor.businessName;
      _cityController.text = vendor.city;
      _addressController.text = vendor.address;
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final updates = {
      'full_name': _fullNameController.text.trim(),
      'phone_number': _phoneController.text.trim(),
      'business_name': _businessNameController.text.trim(),
      'city': _cityController.text.trim(),
      'address': _addressController.text.trim(),
    };

    final success = await profileController.updateProfile(authService.currentUser!.id, updates);
    if (success) {
      setState(() {
        _isEditing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ProfileController, AuthService>(
      builder: (context, profileController, authService, child) {
        if (profileController.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final vendor = profileController.vendorProfile;
        if (vendor == null) {
          return const Center(
            child: Text('Failed to load profile'),
          );
        }

        return Scaffold(
          backgroundColor: AppConstants.backgroundColor,
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
              if (!_isEditing)
                IconButton(
                  onPressed: () {
                    setState(() {
                      _isEditing = true;
                    });
                  },
                  icon: const Icon(Icons.edit),
                )
              else
                TextButton(
                  onPressed: () {
                    setState(() {
                      _isEditing = false;
                    });
                    _loadProfileData();
                  },
                  child: const Text('Cancel'),
                ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              children: [
                _buildProfileHeader(vendor),
                const SizedBox(height: 24),
                _buildProfileForm(vendor),
                const SizedBox(height: 24),
                _buildSettingsSection(),
                const SizedBox(height: 24),
                _buildLogoutButton(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(vendor) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                  backgroundImage: vendor.profileImageUrl != null
                      ? NetworkImage(vendor.profileImageUrl!)
                      : null,
                  child: vendor.profileImageUrl == null
                      ? Icon(
                          Icons.person,
                          size: 50,
                          color: AppConstants.primaryColor,
                        )
                      : null,
                ),
                if (_isEditing)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: _showImagePicker,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppConstants.primaryColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              vendor.fullName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              vendor.businessName,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _getStatusColor(vendor.status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                vendor.statusDisplayText,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _getStatusColor(vendor.status),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Rating', vendor.ratingText),
                _buildStatItem('Orders', '${vendor.totalOrders}'),
                _buildStatItem('Earnings', vendor.formattedEarnings),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppConstants.primaryColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildProfileForm(vendor) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Profile Information',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_isEditing)
                    ElevatedButton(
                      onPressed: profileController.isUpdating ? null : _saveProfile,
                      child: profileController.isUpdating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save'),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              CustomTextField(
                controller: _fullNameController,
                label: 'Full Name',
                hint: 'Enter your full name',
                enabled: _isEditing,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your full name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _phoneController,
                label: 'Phone Number',
                hint: 'Enter your phone number',
                enabled: _isEditing,
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _businessNameController,
                label: 'Business Name',
                hint: 'Enter your business name',
                enabled: _isEditing,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your business name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _cityController,
                label: 'City',
                hint: 'Enter your city',
                enabled: _isEditing,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your city';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _addressController,
                label: 'Address',
                hint: 'Enter your address',
                enabled: _isEditing,
                maxLines: 2,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              const Text(
                'Service Types',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: vendor.serviceTypes.map<Widget>((serviceType) {
                  return Chip(
                    label: Text(serviceType),
                    backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                    labelStyle: TextStyle(
                      color: AppConstants.primaryColor,
                      fontSize: 12,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Settings',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Consumer<ProfileController>(
              builder: (context, controller, child) {
                final vendor = controller.vendorProfile;
                return SwitchListTile(
                  title: const Text('Online Status'),
                  subtitle: Text(
                    vendor?.isOnline == true 
                        ? 'You are currently online and can receive orders'
                        : 'You are offline and won\'t receive new orders',
                  ),
                  value: vendor?.isOnline ?? false,
                  onChanged: (value) {
                    controller.updateOnlineStatus(value, authService);
                  },
                  activeColor: AppConstants.successColor,
                  contentPadding: EdgeInsets.zero,
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.notifications),
              title: const Text('Notification Settings'),
              subtitle: const Text('Manage your notification preferences'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Navigate to notification settings
              },
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.help),
              title: const Text('Help & Support'),
              subtitle: const Text('Get help or contact support'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Navigate to help
              },
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.info),
              title: const Text('About'),
              subtitle: Text('App version ${AppConstants.appVersion}'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Show about dialog
              },
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return CustomButton(
      text: 'Logout',
      onPressed: _showLogoutDialog,
      isOutlined: true,
      backgroundColor: AppConstants.errorColor,
      textColor: AppConstants.errorColor,
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'approved':
        return AppConstants.successColor;
      case 'pending_approval':
        return AppConstants.warningColor;
      case 'suspended':
      case 'rejected':
        return AppConstants.errorColor;
      default:
        return Colors.grey;
    }
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Update Profile Picture',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(
                  children: [
                    IconButton(
                      onPressed: () {
                        Navigator.pop(context);
                        // Implement camera functionality
                      },
                      icon: const Icon(Icons.camera_alt, size: 32),
                      color: AppConstants.primaryColor,
                    ),
                    const Text('Camera'),
                  ],
                ),
                Column(
                  children: [
                    IconButton(
                      onPressed: () {
                        Navigator.pop(context);
                        // Implement gallery functionality
                      },
                      icon: const Icon(Icons.photo_library, size: 32),
                      color: AppConstants.primaryColor,
                    ),
                    const Text('Gallery'),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              authService.logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
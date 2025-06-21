import 'package:flutter/material.dart';
import 'package:junofast/services/order_service.dart';
import 'package:junofast/utils/validators.dart';
import '../config/theme_config.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../widgets/map_location_picker.dart';
import '../services/service_type_service.dart';
import '../models/service_type_model.dart';
import '../models/common_item_model.dart';
import '../models/service_question_model.dart';
import '../services/service_question_service.dart';
import 'package:intl/intl.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({Key? key}) : super(key: key);

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  // Step tracking
  int _currentStep = 0;
  
  // Get total steps based on service type
  int get _totalSteps {
    bool isRelocationService = _selectedService == 'House Relocation' || 
                              _selectedService == 'Office Relocation' || 
                              _selectedService == 'PG Relocation';
    return isRelocationService ? 6 : 5; // 6 steps for relocation, 5 for others (added service questions step)
  }
  
  // Form data
  String? _selectedService;
  final Map<String, dynamic> _orderDetails = {};
  final TextEditingController _pickupAddressController = TextEditingController();
  final TextEditingController _pickupPincodeController = TextEditingController();
  final TextEditingController _dropAddressController = TextEditingController();
  final TextEditingController _dropPincodeController = TextEditingController();
  List<File> _attachedPhotos = [];
  
  // Location coordinates
  double? _pickupLatitude;
  double? _pickupLongitude;
  
  // Service types and common items
  final ServiceTypeService _serviceTypeService = ServiceTypeService();
  List<ServiceTypeModel> _serviceTypes = [];
  List<CommonItemModel> _commonItems = [];
  bool _isLoadingServiceTypes = false;
  bool _isLoadingCommonItems = false;
  
  // Service questions
  final ServiceQuestionService _serviceQuestionService = ServiceQuestionService();
  List<ServiceQuestionModel> _serviceQuestions = [];
  bool _isLoadingServiceQuestions = false;
  final Map<String, dynamic> _questionAnswers = {};
  final Map<String, List<Map<String, dynamic>>> _addedItems = {};
  
  // Custom items added by user
  final List<Map<String, dynamic>> _customItems = [];
  
  // Controller for custom item
  final TextEditingController _customItemNameController = TextEditingController();
  final TextEditingController _customItemDescController = TextEditingController();
  
  // Photos for custom items
  final Map<int, List<File>> _customItemPhotos = {};
  
  // Service-specific form fields
  Map<String, List<Map<String, dynamic>>> _serviceFields = {
    'House Relocation': [
      {'name': 'current_floor', 'label': 'Current Floor', 'type': 'number'},
      {'name': 'destination_floor', 'label': 'Destination Floor', 'type': 'number'},
      {'name': 'has_elevator', 'label': 'Has Elevator', 'type': 'boolean'},
      {'name': 'preferred_date', 'label': 'Preferred Date', 'type': 'text'},
    ],
    'Office Relocation': [
      {'name': 'office_size', 'label': 'Office Size (sq ft)', 'type': 'number'},
      {'name': 'employee_count', 'label': 'Number of Employees', 'type': 'number'},
      {'name': 'current_floor', 'label': 'Current Floor', 'type': 'number'},
      {'name': 'destination_floor', 'label': 'Destination Floor', 'type': 'number'},
      {'name': 'has_elevator', 'label': 'Has Elevator', 'type': 'boolean'},
      {'name': 'preferred_date', 'label': 'Preferred Date', 'type': 'text'},
    ],
    'PG Relocation': [
      {'name': 'current_floor', 'label': 'Current Floor', 'type': 'number'},
      {'name': 'destination_floor', 'label': 'Destination Floor', 'type': 'number'},
      {'name': 'has_elevator', 'label': 'Has Elevator', 'type': 'boolean'},
      {'name': 'preferred_date', 'label': 'Preferred Date', 'type': 'text'},
    ],
    'Automotive Vehicle Relocation': [
      {'name': 'vehicleType', 'label': 'Vehicle Type', 'type': 'dropdown', 'options': ['Car', 'SUV', 'Bike', 'Other']},
      {'name': 'vehicleModel', 'label': 'Vehicle Model', 'type': 'text'},
      {'name': 'isRunning', 'label': 'Is Vehicle in Running Condition?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
    'Pets Relocation': [
      {'name': 'petType', 'label': 'Pet Type', 'type': 'dropdown', 'options': ['Dog', 'Cat', 'Bird', 'Other']},
      {'name': 'petBreed', 'label': 'Pet Breed', 'type': 'text'},
      {'name': 'petAge', 'label': 'Pet Age', 'type': 'number'},
      {'name': 'hasMedicalConditions', 'label': 'Has Medical Conditions?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
    'Motorsports Vehicle Relocation': [
      {'name': 'vehicleType', 'label': 'Vehicle Type', 'type': 'dropdown', 'options': ['Motorcycle', 'ATV', 'Jet Ski', 'Other']},
      {'name': 'vehicleModel', 'label': 'Vehicle Model', 'type': 'text'},
      {'name': 'isRunning', 'label': 'Is Vehicle in Running Condition?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
    'Industrial Shipments': [
      {'name': 'shipmentType', 'label': 'Shipment Type', 'type': 'dropdown', 'options': ['Machinery', 'Raw Materials', 'Finished Goods', 'Other']},
      {'name': 'weight', 'label': 'Approximate Weight (kg)', 'type': 'number'},
      {'name': 'dimensions', 'label': 'Dimensions (LxWxH in cm)', 'type': 'text'},
      {'name': 'isHazardous', 'label': 'Contains Hazardous Materials?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
    'Events & Exhibitions Relocation': [
      {'name': 'eventType', 'label': 'Event Type', 'type': 'text'},
      {'name': 'itemCount', 'label': 'Number of Items', 'type': 'number'},
      {'name': 'hasFragileItems', 'label': 'Has Fragile Items?', 'type': 'boolean'},
      {'name': 'hasElectronics', 'label': 'Has Electronics/AV Equipment?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
    'Courier/Parcel Service': [
      {'name': 'packageType', 'label': 'Package Type', 'type': 'dropdown', 'options': ['Document', 'Small Package', 'Medium Package', 'Large Package']},
      {'name': 'weight', 'label': 'Weight (kg)', 'type': 'number'},
      {'name': 'isFragile', 'label': 'Is Fragile?', 'type': 'boolean'},
      {'name': 'isUrgent', 'label': 'Is Urgent Delivery?', 'type': 'boolean'},
      {'name': 'specialInstructions', 'label': 'Special Instructions', 'type': 'text'},
    ],
  };

  // Step titles
  final List<String> _stepTitles = [
    'Select Service',
    'Enter Details',
    'Answer Questions', // New step for service questions
    'Select Items', // For relocation services
    'Pickup & Delivery',
    'Review & Submit'
  ];
  
  // Get the appropriate step title based on service type
  String _getStepTitle(int step) {
    bool isRelocationService = _selectedService == 'House Relocation' || 
                              _selectedService == 'Office Relocation' || 
                              _selectedService == 'PG Relocation';
    
    if (isRelocationService) {
      return _stepTitles[step];
    } else {
      // For non-relocation services, skip the 'Select Items' step
      if (step < 3) {
        return _stepTitles[step];
      } else {
        return _stepTitles[step + 1]; // Skip index 3 (Select Items)
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _loadServiceTypes();
  }
  
  // Load service types from Supabase
  Future<void> _loadServiceTypes() async {
    setState(() {
      _isLoadingServiceTypes = true;
    });
    
    try {
      final serviceTypes = await _serviceTypeService.getAllServiceTypes();
      setState(() {
        _serviceTypes = serviceTypes;
        _isLoadingServiceTypes = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingServiceTypes = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading service types: $e')),
      );
    }
  }
  
  // Load common items for selected service type
  Future<void> _loadCommonItems(String serviceTypeName) async {
    setState(() {
      _isLoadingCommonItems = true;
      _commonItems = []; // Clear previous items
    });
    
    try {
      final commonItems = await _serviceTypeService.getCommonItemsByServiceTypeName(serviceTypeName);
      final itemsWithIcons = _serviceTypeService.mapIconsToCommonItems(commonItems);
      
      setState(() {
        _commonItems = itemsWithIcons;
        _isLoadingCommonItems = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingCommonItems = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading common items: $e')),
      );
    }
  }
  
  // Load service questions for selected service type
  Future<void> _loadServiceQuestions(String serviceTypeName) async {
    setState(() {
      _isLoadingServiceQuestions = true;
      _serviceQuestions = []; // Clear previous questions
      _questionAnswers.clear(); // Clear previous answers
      _addedItems.clear(); // Clear previous added items
    });
    
    try {
      final questions = await _serviceQuestionService.getQuestionsByServiceTypeName(serviceTypeName);
      
      setState(() {
        _serviceQuestions = questions;
        _isLoadingServiceQuestions = false;
        
        // Initialize answer fields for each question
        for (var question in questions) {
          if (question.type == QuestionType.addItems) {
            _addedItems[question.id] = [];
          } else if (question.type == QuestionType.boolean) {
            _questionAnswers[question.id] = false;
          } else {
            _questionAnswers[question.id] = null;
          }
          
          // Initialize sub-questions if any
          if (question.subQuestions != null) {
            for (var subQuestion in question.subQuestions!) {
              if (subQuestion.type == QuestionType.addItems) {
                _addedItems[subQuestion.id] = [];
              } else if (subQuestion.type == QuestionType.boolean) {
                _questionAnswers[subQuestion.id] = false;
              } else {
                _questionAnswers[subQuestion.id] = null;
              }
            }
          }
        }
      });
    } catch (e) {
      setState(() {
        _isLoadingServiceQuestions = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading service questions: $e')),
      );
    }
  }

  @override
  void dispose() {
    _pickupAddressController.dispose();
    _pickupPincodeController.dispose();
    _dropAddressController.dispose();
    _dropPincodeController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      // Validate service selection
      if (_currentStep == 0) {
        if (_selectedService == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please select a service')),
          );
          return; // Don't proceed if no service is selected
        }
        // Load common items when service is selected and moving to next step
        _loadCommonItems(_selectedService!);
        // Load service questions when service is selected
        _loadServiceQuestions(_selectedService!);
      }
      
      // Validate service details form
      if (_currentStep == 1) {
        if (!_serviceDetailsFormKey.currentState!.validate()) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please fill all required fields')),
          );
          return; // Don't proceed if validation fails
        }
      }
      
      // Validate service questions form
      if (_currentStep == 2) {
        if (!_serviceQuestionsFormKey.currentState!.validate()) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please answer all required questions')),
          );
          return; // Don't proceed if validation fails
        }
      }
      
      // Validate address form when moving from address step to review step
      bool isAddressStep = false;
      if (_selectedService == 'House Relocation' || 
          _selectedService == 'Office Relocation' || 
          _selectedService == 'PG Relocation') {
        isAddressStep = _currentStep == 4;
      } else {
        isAddressStep = _currentStep == 3;
      }
      
      if (isAddressStep) {
        // Validate address form
        if (!_addressFormKey.currentState!.validate()) {
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please fill all required fields')),
          );
          return; // Don't proceed if validation fails
        }
      }
      
      if (_currentStep == 2 && 
          (_selectedService == 'House Relocation' || 
           _selectedService == 'Office Relocation' || 
           _selectedService == 'PG Relocation')) {
        // Go to itemization step
        setState(() {
          _currentStep++;
        });
      } else if (_currentStep == 3 && 
                !(_selectedService == 'House Relocation' || 
                  _selectedService == 'Office Relocation' || 
                  _selectedService == 'PG Relocation')) {
        // For non-relocation services, skip the itemization step
        setState(() {
          _currentStep++;
        });
      } else {
        // Normal flow
        setState(() {
          _currentStep++;
        });
      }
    }
  }
  
  void _previousStep() {
    if (_currentStep > 0) {
      // For relocation services, we need to handle the itemization step
      if (_currentStep == 4 && 
          !(_selectedService == 'House Relocation' || 
            _selectedService == 'Office Relocation' || 
            _selectedService == 'PG Relocation')) {
        // For non-relocation services, skip the itemization step
        setState(() {
          _currentStep = 2;
        });
      } else {
        // Normal flow
        setState(() {
          _currentStep--;
        });
      }
    }
  }

  // Handle system back button
  Future<bool> _onWillPop() async {
    if (_currentStep > 0) {
      _previousStep();
      return false; // Don't pop the route
    }
    return true; // Allow popping to home screen
  }
  
  // Helper method to display custom item photos in the review
  Widget _buildCustomItemPhotosPreview(int itemIndex) {
    final List<File> photos = _customItemPhotos[itemIndex] ?? [];
    
    if (photos.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text(
          'Photos:',
          style: AppTheme.bodyStyle.copyWith(fontSize: 12, color: AppTheme.secondaryColor),
        ),
        const SizedBox(height: 4),
        SizedBox(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: photos.length,
            itemBuilder: (context, photoIndex) {
              return Container(
                width: 60,
                height: 60,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(
                    image: FileImage(photos[photoIndex]),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _attachPhoto() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image != null) {
      setState(() {
        _attachedPhotos.add(File(image.path));
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _attachedPhotos.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop, // Updated to use WillPopScope for proper back button handling
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: Text(
            'Create Order',
            style: AppTheme.headingStyle,
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppTheme.primaryColor),
            onPressed: () {
              if (_currentStep > 0) {
                _previousStep();
              } else {
                Navigator.of(context).pop();
              }
            },
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Progress indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _getStepTitle(_currentStep),
                          style: AppTheme.headingStyle.copyWith(fontSize: 20),
                        ),
                        Text(
                          'Step ${_currentStep + 1}/$_totalSteps',
                          style: AppTheme.bodyStyle.copyWith(
                            color: AppTheme.secondaryColor,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: (_currentStep + 1) / _totalSteps,
                      backgroundColor: const Color(0xFFEEF1F4),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1184e3)),
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ),
              ),
              
              // Step content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildCurrentStep(),
                ),
              ),
              
              // Navigation buttons
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    if (_currentStep > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _previousStep,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF1184e3)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: Text(
                            'Previous',
                            style: AppTheme.bodyStyle.copyWith(
                              color: const Color(0xFF1184e3),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    if (_currentStep > 0) const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _currentStep < _totalSteps - 1 ? _nextStep : _submitOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1184e3),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: Text(
                          _currentStep < _totalSteps - 1 ? 'Next' : 'Submit Order',
                          style: AppTheme.bodyStyle.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildServiceSelection();
      case 1:
        return _buildServiceDetails();
      case 2:
        return _buildServiceQuestions();
      case 3:
        // If the selected service is a relocation service, show the itemization step
        if (_selectedService == 'House Relocation' || 
            _selectedService == 'Office Relocation' || 
            _selectedService == 'PG Relocation') {
          return _buildItemizationStep();
        } else {
          // Skip to address form for non-relocation services
          return _buildAddressForm();
        }
      case 4:
        // For relocation services, this will be the address form
        // For other services, this will be the review step
        if (_selectedService == 'House Relocation' || 
            _selectedService == 'Office Relocation' || 
            _selectedService == 'PG Relocation') {
          return _buildAddressForm();
        } else {
          return _buildOrderReview();
        }
      case 5:
        return _buildOrderReview();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildServiceSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select a service for your order:',
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 24),
        _isLoadingServiceTypes
            ? const Center(child: CircularProgressIndicator())
            : _serviceTypes.isEmpty
                ? Center(
                    child: Column(
                      children: [
                        const Text('No service types available'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadServiceTypes,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _serviceTypes.length,
                    itemBuilder: (context, index) {
                      final serviceType = _serviceTypes[index];
                      final isSelected = _selectedService == serviceType.name;
                      
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedService = serviceType.name;
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF1184e3) : const Color(0xFFEEF1F4),
                              width: 2,
                            ),
                            color: isSelected ? const Color(0xFFE6F2FF) : Colors.white,
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF1184e3) : const Color(0xFFCCD4DB),
                                    width: 2,
                                  ),
                                  color: isSelected ? const Color(0xFF1184e3) : Colors.white,
                                ),
                                child: isSelected
                                    ? const Icon(
                                        Icons.check,
                                        size: 16,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      serviceType.name,
                                      style: AppTheme.bodyStyle.copyWith(
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      ),
                                    ),
                                    if (serviceType.description.isNotEmpty) ...[  
                                      const SizedBox(height: 4),
                                      Text(
                                        serviceType.description,
                                        style: AppTheme.bodyStyle.copyWith(
                                          fontSize: 12,
                                          color: AppTheme.secondaryColor,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ],
    );
  }

  // Form key for service details validation
  final _serviceDetailsFormKey = GlobalKey<FormState>();
  
  // Form key for service questions validation
  final _serviceQuestionsFormKey = GlobalKey<FormState>();
  
  Widget _buildServiceQuestions() {
    if (_selectedService == null) {
      return Center(
        child: Text(
          'Please select a service first',
          style: AppTheme.bodyStyle,
        ),
      );
    }

    if (_isLoadingServiceQuestions) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_serviceQuestions.isEmpty) {
      return Center(
        child: Text(
          'No additional questions for $_selectedService',
          style: AppTheme.bodyStyle,
        ),
      );
    }

    return Form(
      key: _serviceQuestionsFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Please answer these questions for $_selectedService:',
            style: AppTheme.bodyStyle,
          ),
          const SizedBox(height: 24),
          ..._serviceQuestions.map((question) {
            return _buildQuestionWidget(question);
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildQuestionWidget(ServiceQuestionModel question) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  question.question,
                  style: AppTheme.bodyStyle.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              if (question.isRequired)
                Text(
                  ' *',
                  style: AppTheme.bodyStyle.copyWith(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          _buildQuestionInputWidget(question),
          
          // Build sub-questions if any and if parent question is answered
          if (question.subQuestions != null && question.subQuestions!.isNotEmpty) ...[  
            if (_shouldShowSubQuestions(question)) ...[  
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: question.subQuestions!.map((subQuestion) {
                    return _buildQuestionWidget(subQuestion);
                  }).toList(),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  bool _shouldShowSubQuestions(ServiceQuestionModel question) {
    // For boolean questions, show sub-questions only if the answer is true
    if (question.type == QuestionType.boolean) {
      return _questionAnswers[question.id] == true;
    }
    
    // For other question types, show sub-questions if there's any answer
    return _questionAnswers[question.id] != null;
  }

  Widget _buildQuestionInputWidget(ServiceQuestionModel question) {
    switch (question.type) {
      case QuestionType.text:
        return _buildTextQuestionWidget(question);
      case QuestionType.number:
        return _buildNumberQuestionWidget(question);
      case QuestionType.dropdown:
        return _buildDropdownQuestionWidget(question);
      case QuestionType.boolean:
        return _buildBooleanQuestionWidget(question);
      case QuestionType.date:
        return _buildDateQuestionWidget(question);
      case QuestionType.addItems:
        return _buildAddItemsQuestionWidget(question);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildTextQuestionWidget(ServiceQuestionModel question) {
    return TextFormField(
      decoration: InputDecoration(
        hintText: 'Enter your answer',
        filled: true,
        fillColor: const Color(0xFFF0F2F5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      validator: question.isRequired 
          ? (value) => Validators.validateRequired(value, 'answer')
          : null,
      onChanged: (value) {
        setState(() {
          _questionAnswers[question.id] = value;
        });
      },
    );
  }

  Widget _buildNumberQuestionWidget(ServiceQuestionModel question) {
    return TextFormField(
      decoration: InputDecoration(
        hintText: 'Enter a number',
        filled: true,
        fillColor: const Color(0xFFF0F2F5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      keyboardType: TextInputType.number,
      validator: question.isRequired 
          ? (value) => Validators.validateRequired(value, 'number')
          : null,
      onChanged: (value) {
        setState(() {
          _questionAnswers[question.id] = value;
        });
      },
    );
  }

  Widget _buildDropdownQuestionWidget(ServiceQuestionModel question) {
    final options = question.options ?? [];
    
    return FormField<String>(
      validator: question.isRequired 
          ? (value) => value == null ? 'Please select an option' : null
          : null,
      initialValue: _questionAnswers[question.id],
      builder: (FormFieldState<String> state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(12),
                border: state.hasError ? Border.all(color: Colors.red) : null,
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  hint: Text(
                    'Select an option',
                    style: AppTheme.placeholderStyle,
                  ),
                  value: _questionAnswers[question.id],
                  items: options.map((option) {
                    return DropdownMenuItem<String>(
                      value: option,
                      child: Text(option),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _questionAnswers[question.id] = value;
                      state.didChange(value);
                    });
                  },
                ),
              ),
            ),
            if (state.hasError)
              Padding(
                padding: const EdgeInsets.only(left: 12, top: 8),
                child: Text(
                  state.errorText!,
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildBooleanQuestionWidget(ServiceQuestionModel question) {
    bool value = _questionAnswers[question.id] ?? false;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Yes',
          style: AppTheme.bodyStyle,
        ),
        Switch(
          value: value,
          activeColor: const Color(0xFF1184e3),
          onChanged: (newValue) {
            setState(() {
              _questionAnswers[question.id] = newValue;
            });
          },
        ),
      ],
    );
  }

  Widget _buildDateQuestionWidget(ServiceQuestionModel question) {
    String? selectedDate = _questionAnswers[question.id];
    String displayDate = selectedDate ?? 'Select a date';
    
    return FormField<String>(
      validator: question.isRequired 
          ? (value) => value == null ? 'Please select a date' : null
          : null,
      initialValue: selectedDate,
      builder: (FormFieldState<String> state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: () async {
                final DateTime? picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                
                if (picked != null) {
                  final formattedDate = DateFormat('yyyy-MM-dd').format(picked);
                  setState(() {
                    _questionAnswers[question.id] = formattedDate;
                    state.didChange(formattedDate);
                  });
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F2F5),
                  borderRadius: BorderRadius.circular(12),
                  border: state.hasError ? Border.all(color: Colors.red) : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      displayDate,
                      style: displayDate == 'Select a date'
                          ? AppTheme.placeholderStyle
                          : AppTheme.bodyStyle,
                    ),
                    const Icon(
                      Icons.calendar_today,
                      color: Color(0xFF60768A),
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
            if (state.hasError)
              Padding(
                padding: const EdgeInsets.only(left: 12, top: 8),
                child: Text(
                  state.errorText!,
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildAddItemsQuestionWidget(ServiceQuestionModel question) {
    final items = _addedItems[question.id] ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // List of added items
        if (items.isNotEmpty) ...[  
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            itemBuilder: (context, index) {
              return _buildAddedItemCard(items[index], index, question.id);
            },
          ),
          const SizedBox(height: 16),
        ],
        
        // Add item button
        GestureDetector(
          onTap: () => _showAddItemDialog(question.id),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F2F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFEEF1F4)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.add_circle_outline,
                  color: Color(0xFF1184e3),
                ),
                const SizedBox(width: 16),
                Text(
                  'Add Item',
                  style: AppTheme.bodyStyle.copyWith(
                    color: const Color(0xFF1184e3),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Validation error message
        if (question.isRequired && items.isEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 8),
            child: Text(
              'Please add at least one item',
              style: TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _buildAddedItemCard(Map<String, dynamic> item, int index, String questionId) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEEF1F4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  item['name'],
                  style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _addedItems[questionId]!.removeAt(index);
                  });
                },
                child: const Icon(
                  Icons.delete_outline,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          if (item['description'] != null && item['description'].isNotEmpty) ...[  
            const SizedBox(height: 8),
            Text(
              item['description'],
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'Quantity:',
                style: AppTheme.bodyStyle,
              ),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (item['quantity'] > 1) {
                      item['quantity']--;
                    }
                  });
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.remove,
                    size: 16,
                    color: Color(0xFF60768A),
                  ),
                ),
              ),
              Container(
                width: 40,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '${item['quantity']}',
                  style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    item['quantity']++;
                  });
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1184e3),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.add,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddItemDialog(String questionId) {
    final TextEditingController itemNameController = TextEditingController();
    final TextEditingController itemDescController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Add Item',
          style: AppTheme.headingStyle.copyWith(fontSize: 20),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Item Name',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: itemNameController,
                decoration: InputDecoration(
                  hintText: 'Enter item name',
                  filled: true,
                  fillColor: const Color(0xFFF0F2F5),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Description (Optional)',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: itemDescController,
                decoration: InputDecoration(
                  hintText: 'Enter description',
                  filled: true,
                  fillColor: const Color(0xFFF0F2F5),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Cancel',
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (itemNameController.text.trim().isNotEmpty) {
                setState(() {
                  if (_addedItems[questionId] == null) {
                    _addedItems[questionId] = [];
                  }
                  _addedItems[questionId]!.add({
                    'name': itemNameController.text.trim(),
                    'description': itemDescController.text.trim(),
                    'quantity': 1,
                  });
                });
                Navigator.of(context).pop();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1184e3),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Add Item',
              style: AppTheme.bodyStyle.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildServiceDetails() {
    if (_selectedService == null) {
      return Center(
        child: Text(
          'Please select a service first',
          style: AppTheme.bodyStyle,
        ),
      );
    }

    final fields = _serviceFields[_selectedService!] ?? [];
    
    return Form(
      key: _serviceDetailsFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Text(
          'Enter details for $_selectedService:',
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 24),
        ...fields.map((field) {
          switch (field['type']) {
            case 'text':
              return _buildTextField(field);
            case 'number':
              return _buildNumberField(field);
            case 'dropdown':
              return _buildDropdownField(field);
            case 'boolean':
              return _buildSwitchField(field);
            default:
              return const SizedBox.shrink();
          }
        }).toList(),
        
        const SizedBox(height: 24),
        Text(
          'Attach Photos (Optional):',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            GestureDetector(
              onTap: _attachPhoto,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F2F5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFEEF1F4)),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.add_photo_alternate_outlined,
                      color: Color(0xFF60768A),
                      size: 32,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Add Photo',
                      style: TextStyle(
                        color: Color(0xFF60768A),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 100,
                child: _attachedPhotos.isEmpty
                    ? const Center(
                        child: Text(
                          'No photos attached',
                          style: TextStyle(
                            color: Color(0xFF60768A),
                            fontSize: 14,
                          ),
                        ),
                      )
                    : ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _attachedPhotos.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                width: 100,
                                height: 100,
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  image: DecorationImage(
                                    image: FileImage(_attachedPhotos[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 16,
                                child: GestureDetector(
                                  onTap: () => _removePhoto(index),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      size: 16,
                                      color: Colors.red,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ],)
    );
  }

  Widget _buildTextField(Map<String, dynamic> field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            field['label'],
            style: AppTheme.bodyStyle.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            decoration: InputDecoration(
              hintText: 'Enter ${field['label'].toLowerCase()}',
              filled: true,
              fillColor: const Color(0xFFF0F2F5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            validator: (value) => Validators.validateRequired(value, field['label'].toLowerCase()),
            onChanged: (value) {
              setState(() {
                _orderDetails[field['name']] = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNumberField(Map<String, dynamic> field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            field['label'],
            style: AppTheme.bodyStyle.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            decoration: InputDecoration(
              hintText: 'Enter ${field['label'].toLowerCase()}',
              filled: true,
              fillColor: const Color(0xFFF0F2F5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            keyboardType: TextInputType.number,
            validator: (value) => Validators.validateRequired(value, field['label'].toLowerCase()),
            onChanged: (value) {
              setState(() {
                _orderDetails[field['name']] = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField(Map<String, dynamic> field) {
    final options = field['options'] as List;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            field['label'],
            style: AppTheme.bodyStyle.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          FormField<String>(
            validator: (value) => value == null ? 'Please select ${field['label'].toLowerCase()}' : null,
            initialValue: _orderDetails[field['name']],
            builder: (FormFieldState<String> state) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F2F5),
                      borderRadius: BorderRadius.circular(12),
                      border: state.hasError ? Border.all(color: Colors.red) : null,
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        hint: Text(
                          'Select ${field['label'].toLowerCase()}',
                          style: AppTheme.placeholderStyle,
                        ),
                        value: _orderDetails[field['name']],
                        items: options.map((option) {
                          return DropdownMenuItem<String>(
                            value: option,
                            child: Text(option),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _orderDetails[field['name']] = value;
                            state.didChange(value);
                          });
                        },
                      ),
                    ),
                  ),
                  if (state.hasError)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, top: 8),
                      child: Text(
                        state.errorText!,
                        style: TextStyle(color: Colors.red, fontSize: 12),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchField(Map<String, dynamic> field) {
    bool value = _orderDetails[field['name']] ?? false;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            field['label'],
            style: AppTheme.bodyStyle.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          Switch(
            value: value,
            activeColor: const Color(0xFF1184e3),
            onChanged: (newValue) {
              setState(() {
                _orderDetails[field['name']] = newValue;
              });
            },
          ),
        ],
      ),
    );
  }

  // Form key for address validation
  final _addressFormKey = GlobalKey<FormState>();
  
  Widget _buildAddressForm() {
    return Form(
      key: _addressFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pickup Address:',
            style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _pickupAddressController,
            decoration: InputDecoration(
              hintText: 'Enter complete pickup address',
              filled: true,
              fillColor: const Color(0xFFF0F2F5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            maxLines: 3,
            validator: (value) => Validators.validateRequired(value, 'pickup address'),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _pickupPincodeController,
            decoration: InputDecoration(
              hintText: 'Pickup Pincode',
              filled: true,
              fillColor: const Color(0xFFF0F2F5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            keyboardType: TextInputType.number,
            validator: (value) => Validators.validateRequired(value, 'pickup pincode'),
          ),
        
        const SizedBox(height: 16),
        Text(
          'Pickup Location:',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        MapLocationPicker(
          initialLatitude: _pickupLatitude,
          initialLongitude: _pickupLongitude,
          onLocationSelected: (latitude, longitude) {
            setState(() {
              _pickupLatitude = latitude;
              _pickupLongitude = longitude;
            });
          },
        ),
        
        const SizedBox(height: 32),
        Text(
          'Drop-off Address:',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _dropAddressController,
          decoration: InputDecoration(
            hintText: 'Enter complete drop-off address',
            filled: true,
            fillColor: const Color(0xFFF0F2F5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          maxLines: 3,
          validator: (value) => Validators.validateRequired(value, 'drop-off address'),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _dropPincodeController,
          decoration: InputDecoration(
            hintText: 'Drop-off Pincode',
            filled: true,
            fillColor: const Color(0xFFF0F2F5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          keyboardType: TextInputType.number,
          validator: (value) => Validators.validateRequired(value, 'drop-off pincode'),
        ),
      ],)
    );
  }

  Widget _buildOrderReview() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary',
            style: AppTheme.headingStyle.copyWith(fontSize: 20),
          ),
          const SizedBox(height: 24),
          
          // Service
          _buildReviewItem('Service', _selectedService ?? 'Not selected'),
          const Divider(),
          
          // Service details
          if (_selectedService != null) ...[  
            Text(
              'Service Details',
              style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            ...(_serviceFields[_selectedService!] ?? []).map((field) {
              final value = _orderDetails[field['name']];
              String displayValue = 'Not provided';
              
              if (value != null) {
                if (field['type'] == 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else {
                  displayValue = value.toString();
                }
              }
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        field['label'],
                        style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Text(
                        displayValue,
                        style: AppTheme.bodyStyle,
                      ),
                    ),
                  ],
                ),
              );
            }),
            
            // Show itemization for relocation services
            if (_selectedService == 'House Relocation' || 
                _selectedService == 'Office Relocation' || 
                _selectedService == 'PG Relocation') ...[  
              const SizedBox(height: 16),
              Text(
                'Items',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              
              // Common items
              ..._commonItems.where((item) => item.quantity > 0).map((item) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          item.name,
                          style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          '${item.quantity}',
                          style: AppTheme.bodyStyle,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              
              // Custom items
              if (_customItems.isNotEmpty) ...[  
                const SizedBox(height: 8),
                Text(
                  'Custom Items',
                  style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                
                ..._customItems.map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Text(
                                item['name'],
                                style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: Text(
                                '${item['quantity']}',
                                style: AppTheme.bodyStyle,
                              ),
                            ),
                          ],
                        ),
                        if (item['description'] != null && item['description'].isNotEmpty) ...[  
                          const SizedBox(height: 4),
                          Text(
                            'Description: ${item['description']}',
                            style: AppTheme.bodyStyle.copyWith(fontSize: 12, color: AppTheme.secondaryColor),
                          ),
                        ],
                        // Show photos for this custom item if any
                        _buildCustomItemPhotosPreview(_customItems.indexOf(item)),
                      ],
                    ),
                  );
                }),
              ],
            ],
            
            const Divider(),
            // Service Questions Review Section
            if (_serviceQuestions.isNotEmpty) ...[
              Text(
                'Service Questions',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ..._serviceQuestions.map((question) => _buildReviewQuestionWidget(question)).toList(),
              const Divider(),
            ],
          ],
        
        // Addresses
        Text(
          'Pickup Address',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          _pickupAddressController.text.isEmpty
              ? 'Not provided'
              : _pickupAddressController.text,
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 4),
        Text(
          _pickupPincodeController.text.isEmpty
              ? 'Pincode not provided'
              : 'Pincode: ${_pickupPincodeController.text}',
          style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
        ),
        
        const SizedBox(height: 16),
        Text(
          'Drop-off Address',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          _dropAddressController.text.isEmpty
              ? 'Not provided'
              : _dropAddressController.text,
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 4),
        Text(
          _dropPincodeController.text.isEmpty
              ? 'Pincode not provided'
              : 'Pincode: ${_dropPincodeController.text}',
          style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
        ),
        
        const Divider(),
        
        // Photos
        Text(
          'Attached Photos',
          style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        _attachedPhotos.isEmpty
            ? Text(
                'No photos attached',
                style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
              )
            : SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _attachedPhotos.length,
                  itemBuilder: (context, index) {
                    return Container(
                      width: 100,
                      height: 100,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: DecorationImage(
                          image: FileImage(_attachedPhotos[index]),
                          fit: BoxFit.cover,
                        ),
                      ),
                    );
                  },
                ),
              ),
        
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFE6F2FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.info_outline,
                color: Color(0xFF1184e3),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'By submitting this order, you agree to our terms and conditions.',
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 14,
                    color: const Color(0xFF1184e3),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
    );
  }

  Widget _buildReviewItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  // Add this helper below _buildReviewItem
  Widget _buildReviewQuestionWidget(ServiceQuestionModel question, {int indent = 0}) {
    final answer = question.type == QuestionType.addItems
        ? _addedItems[question.id]
        : _questionAnswers[question.id];
    final hasSubQuestions = question.subQuestions != null && question.subQuestions!.isNotEmpty;
    final shouldShowSub = hasSubQuestions && _shouldShowSubQuestions(question);

    Widget answerWidget;
    if (question.type == QuestionType.addItems) {
      final items = answer ?? [];
      if (items.isEmpty) {
        answerWidget = Text('No items added', style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor));
      } else {
        answerWidget = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...items.map<Widget>((item) => Padding(
              padding: EdgeInsets.only(left: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('• ${item['name'] ?? ''}', style: AppTheme.bodyStyle),
                  if (item['description'] != null && item['description'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, top: 2),
                      child: Text('Description: ${item['description']}', style: AppTheme.bodyStyle.copyWith(fontSize: 12, color: AppTheme.secondaryColor)),
                    ),
                  if (item['quantity'] != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, top: 2),
                      child: Text('Quantity: ${item['quantity']}', style: AppTheme.bodyStyle.copyWith(fontSize: 12, color: AppTheme.secondaryColor)),
                    ),
                ],
              ),
            )),
          ],
        );
      }
    } else if (question.type == QuestionType.boolean) {
      answerWidget = Text(
        answer == null ? 'Not answered' : (answer ? 'Yes' : 'No'),
        style: AppTheme.bodyStyle,
      );
    } else if (question.type == QuestionType.dropdown) {
      answerWidget = Text(
        answer == null ? 'Not answered' : answer.toString(),
        style: AppTheme.bodyStyle,
      );
    } else if (question.type == QuestionType.date) {
      answerWidget = Text(
        answer == null ? 'Not answered' : answer.toString(),
        style: AppTheme.bodyStyle,
      );
    } else {
      answerWidget = Text(
        (answer == null || answer.toString().isEmpty) ? 'Not answered' : answer.toString(),
        style: AppTheme.bodyStyle,
      );
    }

    return Padding(
      padding: EdgeInsets.only(left: 8.0 * indent, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: Text(
                  question.question,
                  style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor, fontWeight: FontWeight.w500),
                ),
              ),
              Expanded(
                flex: 3,
                child: answerWidget,
              ),
            ],
          ),
          if (shouldShowSub)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: question.subQuestions!.map((subQ) => _buildReviewQuestionWidget(subQ, indent: indent + 1)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  // Build the itemization step for relocation services
  Widget _buildItemizationStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Items for $_selectedService',
            style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 24),
          
          // Common items section
          Text(
            'Common Items',
            style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          // Grid of common items with quantity selectors
         GridView.builder(
  shrinkWrap: true,
  physics: const NeverScrollableScrollPhysics(),
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 1.2, // Changed from 1.5 to 1.2 for more height
    crossAxisSpacing: 12,
    mainAxisSpacing: 12,
  ),
  itemCount: _commonItems.length,
  itemBuilder: (context, index) {
    final item = _commonItems[index];
    return _buildItemCard(item, index);
  },
),
          
          const SizedBox(height: 32),
          
          // Custom items section
          Text(
            'Custom Items',
            style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          // List of added custom items
          if (_customItems.isNotEmpty) ...[  
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _customItems.length,
              itemBuilder: (context, index) {
                return _buildCustomItemCard(_customItems[index], index);
              },
            ),
            const SizedBox(height: 16),
          ],
          
          // Add custom item button
          GestureDetector(
            onTap: _showAddCustomItemDialog,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFEEF1F4)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.add_circle_outline,
                    color: Color(0xFF1184e3),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    'Add Custom Item',
                    style: AppTheme.bodyStyle.copyWith(
                      color: const Color(0xFF1184e3),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildItemCard(CommonItemModel item, int index) {
  return Container(
    padding: const EdgeInsets.all(8), // Reduced padding
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFEEF1F4)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.05),
          blurRadius: 4,
          offset: const Offset(0, 2),
        ),
      ],
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.spaceBetween, // Changed to spaceBetween
      children: [
        // Image section
        Flexible( // Wrapped in Flexible
          flex: 2,
          child: item.imageUrl.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    item.imageUrl,
                    width: 40,
                    height: 40,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Icon(
                      item.icon ?? Icons.category_outlined,
                      size: 24,
                      color: const Color(0xFF1184e3),
                    ),
                  ),
                )
              : Icon(
                  item.icon ?? Icons.category_outlined,
                  size: 24, // Reduced size
                  color: const Color(0xFF1184e3),
                ),
        ),
        
        // Text section
        Flexible( // Wrapped in Flexible
          flex: 2,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text(
              item.name,
              style: AppTheme.bodyStyle.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 12, // Reduced font size
              ),
              textAlign: TextAlign.center,
              maxLines: 2, // Allow 2 lines
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        
        // Quantity selector section
        Flexible( // Wrapped in Flexible
          flex: 2,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (item.quantity > 0) {
                      item.quantity--;
                    }
                  });
                },
                child: Container(
                  width: 24, // Reduced size
                  height: 24,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.remove,
                    size: 14, // Reduced size
                    color: Color(0xFF60768A),
                  ),
                ),
              ),
              Container(
                width: 32, // Reduced width
                margin: const EdgeInsets.symmetric(horizontal: 6), // Reduced margin
                child: Text(
                  '${item.quantity}',
                  style: AppTheme.bodyStyle.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 14, // Reduced font size
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    item.quantity++;
                  });
                },
                child: Container(
                  width: 24, // Reduced size
                  height: 24,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1184e3),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.add,
                    size: 14, // Reduced size
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
  
  // Build a card for custom items
  Widget _buildCustomItemCard(Map<String, dynamic> item, int index) {
    final List<File> photos = _customItemPhotos[index] ?? [];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEEF1F4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min, // Set to min to prevent overflow
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  item['name'],
                  style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _customItems.removeAt(index);
                    _customItemPhotos.remove(index);
                    
                    // Reindex the photos map
                    final Map<int, List<File>> newPhotosMap = {};
                    _customItemPhotos.forEach((key, value) {
                      if (key > index) {
                        newPhotosMap[key - 1] = value;
                      } else if (key < index) {
                        newPhotosMap[key] = value;
                      }
                    });
                    _customItemPhotos.clear();
                    _customItemPhotos.addAll(newPhotosMap);
                  });
                },
                child: const Icon(
                  Icons.delete_outline,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          if (item['description'] != null && item['description'].isNotEmpty) ...[  
            const SizedBox(height: 8),
            Text(
              item['description'],
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'Quantity:',
                style: AppTheme.bodyStyle,
              ),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (item['quantity'] > 1) {
                      item['quantity']--;
                    }
                  });
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.remove,
                    size: 16,
                    color: Color(0xFF60768A),
                  ),
                ),
              ),
              Container(
                width: 40,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '${item['quantity']}',
                  style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    item['quantity']++;
                  });
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1184e3),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.add,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          if (photos.isNotEmpty) ...[  
            const SizedBox(height: 16),
            Text(
              'Photos:',
              style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: photos.length,
                itemBuilder: (context, photoIndex) {
                  return Stack(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          image: DecorationImage(
                            image: FileImage(photos[photoIndex]),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 12,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              photos.removeAt(photoIndex);
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 12,
                              color: Colors.red,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => _attachPhotoToCustomItem(index),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.add_photo_alternate_outlined,
                    size: 16,
                    color: Color(0xFF1184e3),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Add Photo',
                    style: AppTheme.bodyStyle.copyWith(
                      fontSize: 12,
                      color: const Color(0xFF1184e3),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  // Show dialog to add a custom item
  void _showAddCustomItemDialog() {
    _customItemNameController.clear();
    _customItemDescController.clear();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Add Custom Item',
          style: AppTheme.headingStyle.copyWith(fontSize: 20),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Item Name',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _customItemNameController,
                decoration: InputDecoration(
                  hintText: 'Enter item name',
                  filled: true,
                  fillColor: const Color(0xFFF0F2F5),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Description (Optional)',
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _customItemDescController,
                decoration: InputDecoration(
                  hintText: 'Enter description',
                  filled: true,
                  fillColor: const Color(0xFFF0F2F5),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Cancel',
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (_customItemNameController.text.trim().isNotEmpty) {
                setState(() {
                  _customItems.add({
                    'name': _customItemNameController.text.trim(),
                    'description': _customItemDescController.text.trim(),
                    'quantity': 1,
                  });
                });
                Navigator.of(context).pop();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1184e3),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Add Item',
              style: AppTheme.bodyStyle.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  // Attach photo to a custom item
  Future<void> _attachPhotoToCustomItem(int itemIndex) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      
      if (image != null) {
        setState(() {
          if (_customItemPhotos[itemIndex] == null) {
            _customItemPhotos[itemIndex] = [];
          }
          _customItemPhotos[itemIndex]!.add(File(image.path));
        });
      }
    } catch (e) {
      print('Error picking image: $e');
    }
  }
  
  Future<void> _submitOrder() async {
  // Validate all forms before submission
  if (_selectedService == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please select a service')),
    );
    return;
  }

  // Validate address form
  if (_addressFormKey.currentState != null && !_addressFormKey.currentState!.validate()) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please fill in all required address fields')),
    );
    return;
  }

  // Validate service details form
  if (_serviceDetailsFormKey.currentState != null && !_serviceDetailsFormKey.currentState!.validate()) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please fill in all required service details')),
    );
    return;
  }

  // Validate service questions form
  if (_serviceQuestionsFormKey.currentState != null && !_serviceQuestionsFormKey.currentState!.validate()) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please answer all required questions')),
    );
    return;
  }

  try {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );
    
    final orderService = OrderService();
    
    // Prepare service questions data
    final List<Map<String, dynamic>> serviceQuestionsData = [];
    
    // Process regular questions
    for (var question in _serviceQuestions) {
      if (_questionAnswers.containsKey(question.id) && _questionAnswers[question.id] != null) {
        // For regular questions
        serviceQuestionsData.add({
          'question_id': question.id,
          'question': question.question,
          'answer': _questionAnswers[question.id].toString(),
          'question_type': question.questionType,
        });
        
        // Process sub-questions if any
        if (question.subQuestions != null && _shouldShowSubQuestions(question)) {
          for (var subQuestion in question.subQuestions!) {
            if (_questionAnswers.containsKey(subQuestion.id) && _questionAnswers[subQuestion.id] != null) {
              serviceQuestionsData.add({
                'question_id': subQuestion.id,
                'question': subQuestion.question,
                'answer': _questionAnswers[subQuestion.id].toString(),
                'question_type': subQuestion.questionType,
                'parent_question_id': question.id,
              });
            }
          }
        }
      }
      
      // Process add_items type questions
      if (question.questionType == 'add_items' && _addedItems.containsKey(question.id)) {
        for (var item in _addedItems[question.id]!) {
          serviceQuestionsData.add({
            'question_id': question.id,
            'question': question.question,
            'answer': item['name'] ?? '',
            'question_type': 'add_items_entry',
            'additional_data': item,
          });
        }
      }
    }
    
    // After populating serviceQuestionsData, add debug print:
    print('DEBUG: serviceQuestionsData to be saved:');
    print(serviceQuestionsData);
    
    // Create the order
    final orderId = await orderService.createOrder(
      serviceType: _selectedService!,
      orderDetails: _orderDetails,
      pickupAddress: _pickupAddressController.text,
      pickupPincode: _pickupPincodeController.text,
      pickupLatitude: _pickupLatitude,
      pickupLongitude: _pickupLongitude,
      dropAddress: _dropAddressController.text,
      dropPincode: _dropPincodeController.text,
      commonItems: _commonItems,
      customItems: _customItems,
      customItemPhotos: _customItemPhotos,
      serviceQuestions: serviceQuestionsData,
    );
    
    // Close loading dialog
    Navigator.of(context).pop();
    
    // Show success dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Order Submitted'),
        content: const Text(
          'Your order has been submitted successfully. We will calculate the approximate price and contact you shortly.'
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // Return to home screen
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  } catch (e) {
    // Close loading dialog
    Navigator.of(context).pop();
    
    // Show error dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Error'),
        content: Text('Failed to submit order: ${e.toString()}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
}
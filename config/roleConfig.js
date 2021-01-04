module.exports = {
  permission: [
    {
      label: 'Users',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'delete',
          enable: true,
        },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'reset',
          enable: false,
        },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
        // {
        //   label: 'patient Profile',
        //   enable: true,
        // },
        // {
        //   label: 'account Access',
        //   enable: true,
        // },
        // {
        //   label: 'patient Connect',
        //   enable: false,
        // },
        // {
        //   label: 'medications',
        //   enable: true,
        // },
        // {
        //   label: 'prescriptions',
        //   enable: true,
        // },
        // {
        //   label: 'lab Results',
        //   enable: false,
        // },
      ],
    },
    // {
    //   label: 'Cases',
    //   enable: true,
    //   isParent: true,
    //   parentId: '',
    //   buttons: [
    //     {
    //       label: 'add',
    //       enable: true,
    //     },
    //     {
    //       label: 'edit',
    //       enable: true,
    //     },
    //     {
    //       label: 'assign',
    //       enable: true,
    //     },
    //     {
    //       label: 'notification',
    //       enable: true,
    //     },
    //     // {
    //     //   label: 'delete',
    //     //   enable: true,
    //     // },
    //     // {
    //     //   label: 'visibility',
    //     //   enable: false,
    //     // },
    //     {
    //       label: 'export',
    //       enable: true,
    //     },
    //     {
    //       label: 'query',
    //       enable: true,
    //     },
    //     // {
    //     //   label: 'reset',
    //     //   enable: true,
    //     // },
    //     {
    //       label: 'price',
    //       enable: true,
    //     },
    //   ],
    // },
    {
      label: 'Role',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'assign',
          enable: true,
        },
        // {
        //   label: 'delete',
        //   enable: true,
        // },
        // {
        //   label: 'visibility',
        //   enable: false,
        // },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
      ],
    },
    {
      label: 'Advertisement',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'delete',
          enable: true,
        },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
        // {
        //   label: 'reset',
        //   enable: true,
        // },
      ],
    },
    {
      label: 'Enquiry',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        // {
        //   label: "add",
        //   enable: true,
        // },
        {
          label: 'edit',
          enable: true,
        },
        // {
        //   label: "delete",
        //   enable: true,
        // },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
        // {
        //   label: 'reset',
        //   enable: true,
        // },
      ],
    },
    {
      label: 'Booking',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'delete',
          enable: true,
        },
        {
          label: 'close',
          enable: true,
        },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'changeStatus', // updating status of order
          enable: true,
        }
      ],
    },
    {
      label: 'Doctor', // Doctor details adding page
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'delete',
          enable: true,
        },
        {
          label: 'close',
          enable: true,
        },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'changeStatus', // updating status of order
          enable: true,
        },
        {
          label: 'slot', // change permission to change doctor slot
          enable: true,
        },
      ],
    },
    {
      label: 'Dashboard',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'edit',
          enable: true,
        },

        {
          label: 'visibility',
          enable: false,
        },

        // {
        //   label: 'reset',
        //   enable: true,
        // },
      ],
    },
    // {
    //   label: 'Products',
    //   enable: true,
    //   isParent: true,
    //   parentId: '',
    //   buttons: [
    //     // {
    //     //   label: 'add',
    //     //   enable: true,
    //     // },
    //     // {
    //     //   label: 'edit',
    //     //   enable: true,
    //     // },
    //     // {
    //     //   label: 'delete',
    //     //   enable: true,
    //     // },
    //     // {
    //     //   label: 'visibility',
    //     //   enable: false,
    //     // },
    //     {
    //       label: 'export',
    //       enable: true,
    //     },
    //     {
    //       label: 'upload',
    //       enable: true,
    //     },
    //     // {
    //     //   label: 'uploadInventoryStock', // this is to update inventory stock
    //     //   enable: true,
    //     // },
    //     {
    //       label: 'query',
    //       enable: true,
    //     },
    //     // {
    //     //   label: 'reset',
    //     //   enable: true,
    //     // },
    //   ],
    // },
    // {
    //   label: 'Order',
    //   enable: true,
    //   isParent: true,
    //   parentId: '',
    //   buttons: [
    //     {
    //       label: 'add',
    //       enable: true,
    //     },
    //     {
    //       label: 'edit',
    //       enable: true,
    //     },
    //     {
    //       label: 'delete',
    //       enable: true,
    //     },
    //     {
    //       label: 'close',
    //       enable: true,
    //     },
    //     {
    //       label: 'visibility',
    //       enable: false,
    //     },
    //     // {
    //     //   "label": "export",
    //     //   "enable": true
    //     // },
    //     // {
    //     //   "label": "upload",
    //     //   "enable": true
    //     // },
    //     {
    //       label: 'changeStatus', // updating status of order
    //       enable: true,
    //     },
    //     // {
    //     //   "label": "query",
    //     //   "enable": true
    //     // },
    //     // {
    //     //   label: 'reset',
    //     //   enable: true,
    //     // },
    //   ],
    // },
    // {
    //   label: 'Discount',
    //   enable: true,
    //   isParent: true,
    //   parentId: '',
    //   buttons: [
    //     {
    //       label: 'add',
    //       enable: true,
    //     },
    //     {
    //       label: 'edit',
    //       enable: true,
    //     },
    //     {
    //       label: 'delete',
    //       enable: true,
    //     },
    //     {
    //       label: 'visibility',
    //       enable: false,
    //     },
    //     {
    //       label: 'export',
    //       enable: true,
    //     },
    //     {
    //       label: 'query',
    //       enable: true,
    //     },
    //     {
    //       label: 'reset',
    //       enable: true,
    //     },
    //   ],
    // },
    // {
    //   label: 'NotificationTemplate',
    //   enable: true,
    //   isParent: true,
    //   parentId: '',
    //   buttons: [
    //     {
    //       label: 'add',
    //       enable: true,
    //     },
    //     {
    //       label: 'edit',
    //       enable: true,
    //     },
    //     {
    //       label: 'delete',
    //       enable: true,
    //     },
    //     {
    //       label: 'visibility',
    //       enable: false,
    //     },
    //     {
    //       label: 'export',
    //       enable: true,
    //     },
    //     {
    //       label: 'query',
    //       enable: true,
    //     },
    //     {
    //       label: 'reset',
    //       enable: true,
    //     },
    //   ],
    // },
  ],
};
